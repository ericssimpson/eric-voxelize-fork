mod clients;
mod components;
mod config;
mod generators;
mod messages;
mod physics;
mod registry;
mod search;
mod stats;
mod systems;
mod types;
mod utils;
mod voxels;

use actix::Recipient;
use hashbrown::HashMap;
use log::info;
use nanoid::nanoid;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use specs::{
    shred::{Fetch, FetchMut, Resource},
    world::EntitiesRes,
    Builder, Component, DispatcherBuilder, Entity, Read, ReadStorage, World as ECSWorld, WorldExt,
    WriteStorage,
};

use crate::{
    encode_message,
    protocols::Peer,
    server::{Message, MessageType},
    EncodedMessage, PeerProtocol, Vec2, Vec3,
};

use super::common::ClientFilter;

use self::systems::{
    BroadcastEntitiesSystem, BroadcastPeersSystem, BroadcastSystem, ChunkMeshingSystem,
    ChunkPipeliningSystem, ChunkRequestsSystem, ChunkSendingSystem, ChunkUpdatingSystem,
    CurrentChunkSystem, EntityMetaSystem, PhysicsSystem, SearchSystem, UpdateStatsSystem,
};

pub use clients::*;
pub use components::*;
pub use config::*;
pub use generators::*;
pub use messages::*;
pub use physics::*;
pub use registry::*;
pub use search::*;
pub use stats::*;
pub use types::*;
pub use utils::*;
pub use voxels::*;

pub type ModifyDispatch =
    fn(DispatcherBuilder<'static, 'static>) -> DispatcherBuilder<'static, 'static>;

pub type IntervalFunctions = Vec<(dyn FnMut(&mut World), u64)>;

/// A voxelize world.
#[derive(Default)]
pub struct World {
    /// ID of the world, generated from `nanoid!()`.
    pub id: String,

    /// Name of the world, used for connection.
    pub name: String,

    /// Whether if the world has started.
    pub started: bool,

    /// Entity component system world.
    ecs: ECSWorld,

    dispatcher: Option<ModifyDispatch>,
}

fn get_default_dispatcher(
    builder: DispatcherBuilder<'static, 'static>,
) -> DispatcherBuilder<'static, 'static> {
    builder
}

#[derive(Serialize, Deserialize)]
struct OnLoadRequest {
    chunks: Vec<Vec2<i32>>,
}

#[derive(Serialize, Deserialize)]
struct OnUnloadRequest {
    chunks: Vec<Vec2<i32>>,
}

#[derive(Serialize, Deserialize)]
struct OnDebugRequest {
    method: String,
    data: Value,
}

impl World {
    /// Create a new voxelize world.
    pub fn new(name: &str, config: &WorldConfig) -> Self {
        let id = nanoid!();

        let mut ecs = ECSWorld::new();

        ecs.register::<ChunkRequestsComp>();
        ecs.register::<CurrentChunkComp>();
        ecs.register::<IDComp>();
        ecs.register::<NameComp>();
        ecs.register::<PositionComp>();
        ecs.register::<DirectionComp>();
        ecs.register::<ClientFlag>();
        ecs.register::<EntityFlag>();
        ecs.register::<ETypeComp>();
        ecs.register::<HeadingComp>();
        ecs.register::<MetadataComp>();
        ecs.register::<TargetComp>();
        ecs.register::<RigidBodyComp>();
        ecs.register::<AddrComp>();
        ecs.register::<InteractorComp>();

        ecs.insert(name.to_owned());
        ecs.insert(config.clone());

        ecs.insert(Chunks::new(config));
        ecs.insert(SeededNoise::new(config.seed));
        ecs.insert(SeededTerrain::new(config.seed, &config.terrain));
        ecs.insert(Search::new());

        ecs.insert(Mesher::new());
        ecs.insert(Pipeline::new());
        ecs.insert(Clients::new());
        ecs.insert(MessageQueue::new());
        ecs.insert(Stats::new());
        ecs.insert(Physics::new());

        Self {
            id,
            name: name.to_owned(),
            started: false,

            ecs,

            dispatcher: Some(get_default_dispatcher),
        }
    }

    /// Get a reference to the ECS world..
    pub fn ecs(&self) -> &ECSWorld {
        &self.ecs
    }

    /// Get a mutable reference to the ECS world.
    pub fn ecs_mut(&mut self) -> &mut ECSWorld {
        &mut self.ecs
    }

    /// Read an ECS resource generically.
    pub fn read_resource<T: Resource>(&self) -> Fetch<T> {
        self.ecs.read_resource::<T>()
    }

    /// Write an ECS resource generically.
    pub fn write_resource<T: Resource>(&mut self) -> FetchMut<T> {
        self.ecs.write_resource::<T>()
    }

    /// Read an ECS component storage.
    pub fn read_component<T: Component>(&self) -> ReadStorage<T> {
        self.ecs.read_component::<T>()
    }

    /// Write an ECS component storage.
    pub fn write_component<T: Component>(&mut self) -> WriteStorage<T> {
        self.ecs.write_component::<T>()
    }

    /// Read an entity by ID in the ECS world.
    pub fn get_entity(&self, ent_id: u32) -> Entity {
        self.entities().entity(ent_id)
    }

    /// Add a client to the world by an ID and an Actix actor address.
    pub fn add_client(&mut self, id: &str, addr: &Recipient<EncodedMessage>) {
        let config = self.config().get_init_config();
        let mut json = HashMap::new();

        json.insert("id".to_owned(), json!(id));
        json.insert("blocks".to_owned(), json!(self.registry().blocks_by_name));
        json.insert("ranges".to_owned(), json!(self.registry().ranges));
        json.insert("params".to_owned(), json!(config));

        let mut peers = vec![];

        self.clients().keys().for_each(|key| {
            peers.push(PeerProtocol {
                id: key.to_owned(),
                ..Default::default()
            })
        });

        let body = RigidBody::new(&AABB::new(0.0, 0.0, 0.0, 0.8, 1.8, 0.8)).build();

        let body_handle = self.physics_mut().register(&body);

        let ent = self
            .ecs
            .create_entity()
            .with(ClientFlag::default())
            .with(IDComp::new(id))
            .with(NameComp::new("testtesttest"))
            .with(AddrComp::new(addr))
            .with(ChunkRequestsComp::default())
            .with(CurrentChunkComp::default())
            .with(PositionComp::default())
            .with(DirectionComp::default())
            .with(RigidBodyComp::new(&body))
            .with(InteractorComp::new(body_handle))
            .build();

        self.clients_mut().insert(
            id.to_owned(),
            Client {
                id: id.to_owned(),
                entity: ent,
                addr: addr.to_owned(),
            },
        );

        let init_message = Message::new(&MessageType::Init)
            .json(&serde_json::to_string(&json).unwrap())
            .peers(&peers)
            .build();

        self.send(addr, &init_message);

        let join_message = Message::new(&MessageType::Join).text(id).build();
        self.broadcast(join_message, ClientFilter::All);
    }

    /// Remove a client from the world by endpoint.
    pub fn remove_client(&mut self, id: &str) {
        let removed = self.clients_mut().remove(id);

        if let Some(client) = removed {
            {
                let entities = self.ecs.entities();

                entities.delete(client.entity).unwrap_or_else(|_| {
                    panic!(
                        "Something went wrong with deleting this client: {}",
                        client.id
                    )
                });
            }

            let leave_message = Message::new(&MessageType::Leave).text(&client.id).build();
            self.broadcast(leave_message, ClientFilter::All);
        }
    }

    pub fn set_dispatcher(&mut self, dispatch: ModifyDispatch) {
        self.dispatcher = Some(dispatch);
    }

    /// Handler for protobuf requests from clients.
    pub fn on_request(&mut self, client_id: &str, data: Message) {
        let msg_type = MessageType::from_i32(data.r#type).unwrap();

        match msg_type {
            MessageType::Peer => self.on_peer(client_id, data),
            MessageType::Load => self.on_load(client_id, data),
            MessageType::Unload => self.on_unload(client_id, data),
            MessageType::Debug => self.on_debug(client_id, data),
            MessageType::Chat => self.on_chat(client_id, data),
            MessageType::Update => self.on_update(client_id, data),
            _ => {
                info!("Received message of unknown type: {:?}", msg_type);
            }
        }
    }

    /// Broadcast a protobuf message to a subset or all of the clients in the world.
    pub fn broadcast(&mut self, data: Message, filter: ClientFilter) {
        self.write_resource::<MessageQueue>().push((data, filter));
    }

    /// Send a direct message to an endpoint
    pub fn send(&self, addr: &Recipient<EncodedMessage>, data: &Message) {
        addr.do_send(EncodedMessage(encode_message(data)));
    }

    /// Access to the world's config.
    pub fn config(&self) -> Fetch<WorldConfig> {
        self.read_resource::<WorldConfig>()
    }

    /// Access all clients in the ECS world.
    pub fn clients(&self) -> Fetch<Clients> {
        self.read_resource::<Clients>()
    }

    /// Access a mutable clients map in the ECS world.
    pub fn clients_mut(&mut self) -> FetchMut<Clients> {
        self.write_resource::<Clients>()
    }

    /// Access the registry in the ECS world.
    pub fn registry(&self) -> Fetch<Registry> {
        self.read_resource::<Registry>()
    }

    /// Access chunks management in the ECS world.
    pub fn chunks(&self) -> Fetch<Chunks> {
        self.read_resource::<Chunks>()
    }

    /// Access a mutable chunk manager in the ECS world.
    pub fn chunks_mut(&mut self) -> FetchMut<Chunks> {
        self.write_resource::<Chunks>()
    }

    /// Access physics management in the ECS world.
    pub fn physics(&self) -> Fetch<Physics> {
        self.read_resource::<Physics>()
    }

    /// Access a mutable physics manager in the ECS world.
    pub fn physics_mut(&mut self) -> FetchMut<Physics> {
        self.write_resource::<Physics>()
    }

    /// Access the terrain of the ECS world.
    pub fn terrain(&self) -> Fetch<SeededTerrain> {
        self.read_resource::<SeededTerrain>()
    }

    /// Access a mutable terrain of the ECS world.
    pub fn terrain_mut(&mut self) -> FetchMut<SeededTerrain> {
        assert!(
            !self.started,
            "Cannot change terrain after world has started."
        );
        self.write_resource::<SeededTerrain>()
    }

    /// Access pipeline management in the ECS world.
    pub fn pipeline(&self) -> Fetch<Pipeline> {
        self.read_resource::<Pipeline>()
    }

    /// Access a mutable pipeline management in the ECS world.
    pub fn pipeline_mut(&mut self) -> FetchMut<Pipeline> {
        assert!(
            !self.started,
            "Cannot change pipeline after world has started."
        );
        self.write_resource::<Pipeline>()
    }

    /// Access all entities in this ECS world.
    pub fn entities(&self) -> Read<EntitiesRes> {
        self.ecs.entities()
    }

    /// Access and mutate all entities in this ECS world.
    pub fn entities_mut(&mut self) -> FetchMut<EntitiesRes> {
        assert!(!self.started, "Cannot change ECS after world has started.");
        self.ecs.entities_mut()
    }

    /// Set an interval to do something every X ticks.
    pub fn set_interval(&mut self, func: &(dyn FnOnce(&mut World) + Sync + Send), interval: usize) {
        // self.write_resource::<IntervalFunctions>()
        //     .push((Arc::new(func.to_owned()), interval));
    }

    /// Check if this world is empty.
    pub fn is_empty(&self) -> bool {
        let clients = self.read_resource::<Clients>();
        clients.is_empty()
    }

    /// Prepare to start.
    pub fn prepare(&mut self) {
        use specs::Join;
        for (position, body) in (
            &self.ecs.read_storage::<PositionComp>(),
            &mut self.ecs.write_storage::<RigidBodyComp>(),
        )
            .join()
        {
            body.0
                .set_position(position.0 .0, position.0 .1, position.0 .2);
        }
    }

    /// Tick of the world, run every 16ms.
    pub fn tick(&mut self) {
        if !self.started {
            self.started = true;
        }

        if self.is_empty() {
            return;
        }

        let builder = DispatcherBuilder::new()
            .with(UpdateStatsSystem, "update-stats", &[])
            .with(EntityMetaSystem, "entity-meta", &[])
            .with(SearchSystem, "search", &["entity-meta"])
            .with(CurrentChunkSystem, "current-chunking", &[])
            .with(ChunkUpdatingSystem, "chunk-updating", &["current-chunking"])
            .with(ChunkRequestsSystem, "chunk-requests", &["current-chunking"])
            .with(
                ChunkPipeliningSystem,
                "chunk-pipelining",
                &["chunk-requests"],
            )
            .with(ChunkMeshingSystem, "chunk-meshing", &["chunk-pipelining"])
            .with(ChunkSendingSystem, "chunk-sending", &["chunk-meshing"]);

        let builder = self.dispatcher.unwrap()(builder);

        let builder = builder
            .with(PhysicsSystem, "physics", &["update-stats"])
            .with(BroadcastEntitiesSystem, "broadcast-entities", &[])
            .with(BroadcastPeersSystem, "broadcast-peers", &[])
            .with(BroadcastSystem, "broadcast", &["broadcast-entities"]);

        let mut dispatcher = builder.build();
        dispatcher.dispatch(&self.ecs);

        self.ecs.maintain();
    }

    /// Handler for `Peer` type messages.
    fn on_peer(&mut self, client_id: &str, data: Message) {
        let client_ent = if let Some(client) = self.clients().get(client_id) {
            client.entity.to_owned()
        } else {
            return;
        };

        data.peers.into_iter().for_each(|peer| {
            let Peer {
                direction,
                position,
                name,
                ..
            } = peer;

            {
                let mut names = self.write_component::<NameComp>();
                if let Some(n) = names.get_mut(client_ent) {
                    n.0 = name;
                }
            }

            if let Some(position) = position {
                {
                    let mut positions = self.write_component::<PositionComp>();
                    if let Some(p) = positions.get_mut(client_ent) {
                        p.0.set(position.x, position.y, position.z);
                    }
                }

                {
                    let mut bodies = self.write_component::<RigidBodyComp>();
                    if let Some(b) = bodies.get_mut(client_ent) {
                        b.0.set_position(position.x, position.y, position.z);
                    }
                }

                {
                    let interactors = self.read_component::<InteractorComp>();

                    let handle = if let Some(i) = interactors.get(client_ent) {
                        Some(i.0.clone())
                    } else {
                        None
                    };

                    drop(interactors);

                    if let Some(handle) = handle {
                        self.physics_mut()
                            .move_rapier_body(&handle, &Vec3(position.x, position.y, position.z));
                    }
                }
            }

            if let Some(direction) = direction {
                let mut directions = self.write_component::<DirectionComp>();
                if let Some(d) = directions.get_mut(client_ent) {
                    d.0.set(direction.x, direction.y, direction.z);
                }
            }
        })
    }

    /// Handler for `Load` type messages.
    fn on_load(&mut self, client_id: &str, data: Message) {
        let client_ent = if let Some(client) = self.clients().get(client_id) {
            client.entity.to_owned()
        } else {
            return;
        };

        let json: OnLoadRequest =
            serde_json::from_str(&data.json).expect("`on_load` error. Could not read JSON string.");

        let chunks = json.chunks;
        if chunks.is_empty() {
            return;
        }

        let mut storage = self.write_component::<ChunkRequestsComp>();

        if let Some(requests) = storage.get_mut(client_ent) {
            chunks.into_iter().for_each(|coords| {
                requests.add(&coords);
            });
        }
    }

    /// Handler for `Unload` type messages.
    fn on_unload(&mut self, client_id: &str, data: Message) {
        let client_ent = if let Some(client) = self.clients().get(client_id) {
            client.entity.to_owned()
        } else {
            return;
        };

        let json: OnUnloadRequest = serde_json::from_str(&data.json)
            .expect("`on_unload` error. Could not read JSON string.");

        let chunks = json.chunks;
        if chunks.is_empty() {
            return;
        }

        let mut storage = self.write_component::<ChunkRequestsComp>();

        if let Some(requests) = storage.get_mut(client_ent) {
            chunks.into_iter().for_each(|coords| {
                requests.unload(&coords);
            });
        }
    }

    /// Handler for `Update` type messages.
    fn on_update(&mut self, _: &str, data: Message) {
        let chunk_size = self.config().chunk_size;
        let mut chunks = self.chunks_mut();

        data.updates.into_iter().for_each(|update| {
            let coords =
                ChunkUtils::map_voxel_to_chunk(update.vx, update.vy, update.vz, chunk_size);

            if !chunks.is_within_world(&coords) {
                return;
            }

            chunks
                .to_update
                .push_front((Vec3(update.vx, update.vy, update.vz), update.voxel));
        });
    }

    /// Handler for `Debug` type messages.
    fn on_debug(&mut self, _: &str, data: Message) {
        let json: OnDebugRequest = serde_json::from_str(&data.json)
            .expect("`on_debug` error. Could not read JSON string.");

        let mut chunks = self.chunks_mut();

        if json.method.to_lowercase() == "remesh" {
            let x = json.data["cx"].as_i64().unwrap() as i32;
            let z = json.data["cz"].as_i64().unwrap() as i32;

            let coords = Vec2(x, z);

            if chunks.is_within_world(&coords) && !chunks.to_remesh.contains(&coords) {
                chunks.to_remesh.push_front(coords);
            }
        } else {
            info!("Received unknown debug method of {}", json.method);
        }
    }

    /// Handler for `Chat` type messages.
    fn on_chat(&mut self, _: &str, data: Message) {
        if let Some(chat) = data.chat.clone() {
            let sender = chat.sender;
            let body = chat.body;

            info!("{}: {}", sender, body);

            if body.starts_with('/') {
                let body = body
                    .strip_prefix('/')
                    .unwrap()
                    .split_whitespace()
                    .collect::<Vec<_>>();

                // let mut msgs = vec![];
            } else {
                self.broadcast(data, ClientFilter::All);
            }
        }
    }
}

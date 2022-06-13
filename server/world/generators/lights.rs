use std::collections::VecDeque;

use log::info;

use crate::{
    Block, ChunkUtils, LightColor, Ndarray, Registry, Vec2, Vec3, VoxelAccess, WorldConfig,
};

pub const VOXEL_NEIGHBORS: [[i32; 3]; 6] = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 0, 1],
    [0, 0, -1],
    [0, 1, 0],
    [0, -1, 0],
];

/// Node of a light propagation queue.
#[derive(Debug)]
pub struct LightNode {
    pub voxel: [i32; 3],
    pub level: u32,
}

/// A set of utility functions to simulate global illumination in a Voxelize world.
pub struct Lights;

impl Lights {
    /// Propagate a specific queue of `LightNode`s in a depth-first-search fashion. If the propagation
    /// is for sunlight, light value does not decrease going downwards to simulate sunshine.
    pub fn flood_light(
        space: &mut dyn VoxelAccess,
        mut queue: VecDeque<LightNode>,
        color: &LightColor,
        registry: &Registry,
        config: &WorldConfig,
        min: Option<&Vec3<i32>>,
        shape: Option<&Vec3<usize>>,
    ) {
        let &WorldConfig {
            max_height,
            min_chunk,
            max_chunk,
            max_light_level,
            ..
        } = config;

        let [start_cx, start_cz] = min_chunk;
        let [end_cx, end_cz] = max_chunk;

        let max_height = max_height as i32;
        let is_sunlight = *color == LightColor::Sunlight;

        while !queue.is_empty() {
            let LightNode { voxel, level } = queue.pop_front().unwrap();
            let [vx, vy, vz] = voxel;

            if level == 0 {
                break;
            }

            for [ox, oy, oz] in VOXEL_NEIGHBORS.into_iter() {
                let nvy = vy + oy;

                if nvy < 0 || nvy >= max_height {
                    continue;
                }

                let nvx = vx + ox;
                let nvz = vz + oz;

                let Vec2(ncx, ncz) =
                    ChunkUtils::map_voxel_to_chunk(nvx, nvy, nvz, config.chunk_size);

                if ncx < start_cx
                    || ncz < start_cz
                    || ncx > end_cx
                    || ncz > end_cz
                    || if let Some(&Vec3(start_x, _, start_z)) = min {
                        nvx < start_x
                            || nvz < start_z
                            || if let Some(&Vec3(shape0, _, shape2)) = shape {
                                nvx >= start_x + shape0 as i32 || nvz >= start_z + shape2 as i32
                            } else {
                                false
                            }
                    } else {
                        false
                    }
                {
                    continue;
                }

                let next_level = level
                    - if is_sunlight && oy == -1 && level == max_light_level {
                        0
                    } else {
                        1
                    };
                let next_voxel = [nvx, nvy, nvz];
                let block_type = registry.get_block_by_id(space.get_voxel(nvx, nvy, nvz));

                if !block_type.is_transparent
                    || (if is_sunlight {
                        space.get_sunlight(nvx, nvy, nvz)
                    } else {
                        space.get_torch_light(nvx, nvy, nvz, color)
                    } >= next_level)
                {
                    continue;
                }

                if is_sunlight {
                    space.set_sunlight(nvx, nvy, nvz, next_level);
                } else {
                    space.set_torch_light(nvx, nvy, nvz, next_level, color);
                }

                queue.push_back(LightNode {
                    voxel: next_voxel,
                    level: next_level,
                });
            }
        }
    }

    pub fn remove_light(
        space: &mut dyn VoxelAccess,
        voxel: &Vec3<i32>,
        color: &LightColor,
        config: &WorldConfig,
        registry: &Registry,
    ) {
        let max_height = config.max_height as i32;
        let max_light_level = config.max_light_level;

        let mut fill = VecDeque::<LightNode>::new();
        let mut queue = VecDeque::<LightNode>::new();

        let is_sunlight = *color == LightColor::Sunlight;
        let &Vec3(vx, vy, vz) = voxel;

        queue.push_back(LightNode {
            voxel: [vx, vy, vz],
            level: if is_sunlight {
                space.get_sunlight(vx, vy, vz)
            } else {
                space.get_torch_light(vx, vy, vz, color)
            },
        });

        if is_sunlight {
            space.set_sunlight(vx, vy, vz, 0);
        } else {
            space.set_torch_light(vx, vy, vz, 0, color);
        }

        while !queue.is_empty() {
            let LightNode { voxel, level } = queue.pop_front().unwrap();
            let [vx, vy, vz] = voxel;

            for [ox, oy, oz] in VOXEL_NEIGHBORS.into_iter() {
                let nvy = vy + oy;

                if nvy < 0 || nvy >= max_height {
                    continue;
                }

                let nvx = vx + ox;
                let nvz = vz + oz;
                let n_voxel = [nvx, nvy, nvz];

                let nl = if is_sunlight {
                    space.get_sunlight(nvx, nvy, nvz)
                } else {
                    space.get_torch_light(nvx, nvy, nvz, color)
                };

                if nl == 0 {
                    continue;
                }

                // if level is less, or if sunlight is propagating downwards without stopping
                if nl < level
                    || (is_sunlight
                        && oy == -1
                        && level == max_light_level
                        && nl == max_light_level)
                {
                    queue.push_back(LightNode {
                        voxel: n_voxel,
                        level: nl,
                    });

                    if is_sunlight {
                        space.set_sunlight(nvx, nvy, nvz, 0);
                    } else {
                        space.set_torch_light(nvx, nvy, nvz, 0, color);
                    }
                } else if nl >= level && (!is_sunlight || oy != -1 || nl > level) {
                    fill.push_back(LightNode {
                        voxel: n_voxel,
                        level: nl,
                    })
                }
            }
        }

        Lights::flood_light(space, fill, color, registry, config, None, None);
    }

    /// Propagate a space and return the light data of the center chunk.
    pub fn propagate(
        space: &mut dyn VoxelAccess,
        min: &Vec3<i32>,
        center: &Vec2<i32>,
        shape: &Vec3<usize>,
        registry: &Registry,
        config: &WorldConfig,
    ) -> Ndarray<u32> {
        let &WorldConfig {
            max_height,
            max_light_level,
            ..
        } = config;

        let mut red_light_queue = VecDeque::<LightNode>::new();
        let mut green_light_queue = VecDeque::<LightNode>::new();
        let mut blue_light_queue = VecDeque::<LightNode>::new();
        let mut sunlight_queue = VecDeque::<LightNode>::new();

        const RED: LightColor = LightColor::Red;
        const GREEN: LightColor = LightColor::Green;
        const BLUE: LightColor = LightColor::Blue;
        const SUNLIGHT: LightColor = LightColor::Sunlight;

        let Vec3(start_x, _, start_z) = min;
        let shape = Vec3(shape.0 as i32, shape.1 as i32, shape.2 as i32);

        let mut mask = vec![];
        for _ in 0..(shape.0 * shape.2) {
            mask.push(max_light_level);
        }

        for y in (0..max_height as i32).rev() {
            for x in 0..shape.0 {
                for z in 0..shape.2 {
                    let index = (x + z * shape.2) as usize;

                    let id = space.get_voxel(x + start_x, y, z + start_z);
                    let &Block {
                        is_transparent,
                        is_light,
                        red_light_level,
                        green_light_level,
                        blue_light_level,
                        ..
                    } = registry.get_block_by_id(id);

                    if is_transparent {
                        space.set_sunlight(x + start_x, y, z + start_z, mask[index]);

                        if mask[index] == 0 {
                            if (x > 0 && mask[(x - 1 + z * shape.2) as usize] == max_light_level)
                                || (x < shape.0 - 1
                                    && mask[(x + 1 + z * shape.2) as usize] == max_light_level)
                                || (z > 0
                                    && mask[(x + (z - 1) * shape.2) as usize] == max_light_level)
                                || (z < shape.2 - 1
                                    && mask[(x + (z + 1) * shape.2) as usize] == max_light_level)
                            {
                                space.set_sunlight(
                                    x + start_x,
                                    y,
                                    z + start_z,
                                    max_light_level - 1,
                                );
                                sunlight_queue.push_back(LightNode {
                                    level: max_light_level - 1,
                                    voxel: [start_x + x, y, start_z + z],
                                });
                            }
                        }
                    } else {
                        mask[index] = 0;
                    }

                    if is_light {
                        if red_light_level > 0 {
                            space.set_red_light(x + start_x, y, z + start_z, red_light_level);
                            red_light_queue.push_back(LightNode {
                                voxel: [x + start_x, y, z + start_z],
                                level: red_light_level,
                            });
                        }
                        if green_light_level > 0 {
                            space.set_green_light(x + start_x, y, z + start_z, green_light_level);
                            green_light_queue.push_back(LightNode {
                                voxel: [x + start_x, y, z + start_z],
                                level: green_light_level,
                            });
                        }
                        if blue_light_level > 0 {
                            space.set_blue_light(x + start_x, y, z + start_z, blue_light_level);
                            blue_light_queue.push_back(LightNode {
                                voxel: [x + start_x, y, z + start_z],
                                level: blue_light_level,
                            });
                        }
                    }
                }
            }
        }

        let shape = Vec3(shape.0 as usize, shape.1 as usize, shape.2 as usize);

        if !red_light_queue.is_empty() {
            Lights::flood_light(
                space,
                red_light_queue,
                &RED,
                registry,
                config,
                Some(min),
                Some(&shape),
            );
        }

        if !green_light_queue.is_empty() {
            Lights::flood_light(
                space,
                green_light_queue,
                &GREEN,
                registry,
                config,
                Some(min),
                Some(&shape),
            );
        }

        if !blue_light_queue.is_empty() {
            Lights::flood_light(
                space,
                blue_light_queue,
                &BLUE,
                registry,
                config,
                Some(min),
                Some(&shape),
            );
        }

        if !sunlight_queue.is_empty() {
            Lights::flood_light(
                space,
                sunlight_queue,
                &SUNLIGHT,
                registry,
                config,
                Some(min),
                Some(&shape),
            );
        }

        space.get_lights(center.0, center.1).unwrap().to_owned()
    }
}

#[cfg(test)]
mod tests {
    use crate::*;

    fn make_test_chunk(height: i32) -> Chunk {
        let mut chunk = Chunk::new(
            "test",
            0,
            0,
            &ChunkParams {
                max_height: 64,
                size: 16,
            },
        );

        let Vec3(min_x, _, min_z) = chunk.min;
        let Vec3(max_x, _, max_z) = chunk.max;

        for vx in min_x..max_x {
            for vz in min_z..max_z {
                for vy in 0..height {
                    chunk.set_voxel(vx, vy, vz, 1);
                }
            }
        }

        chunk
    }

    fn make_test_registry() -> Registry {
        let mut registry = Registry::new();
        registry.register_block(&Block::new("Dirt").is_solid(true).build());
        registry
    }

    fn make_test_config() -> WorldConfig {
        WorldConfig::new()
            .chunk_size(16)
            .max_height(64)
            .max_light_level(15)
            .min_chunk([0, 0])
            .max_chunk([0, 0])
            .build()
    }

    #[test]
    fn propagate_works() {
        let height = 10;

        let mut chunk = make_test_chunk(height);

        let registry = make_test_registry();
        let config = make_test_config();

        let min = chunk.min.to_owned();
        let coords = chunk.coords.to_owned();

        let shape = &chunk.max - &chunk.min;
        let shape = Vec3(shape.0 as usize, shape.1 as usize, shape.2 as usize);

        Lights::propagate(&mut chunk, &min, &coords, &shape, &registry, &config);

        for vy in 0..height {
            assert!(chunk.get_sunlight(0, vy, 0) == 0);
        }

        for vy in height..(config.max_height as i32) {
            assert!(chunk.get_sunlight(0, vy, 0) == config.max_light_level);
        }
    }
}

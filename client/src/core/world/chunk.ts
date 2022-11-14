import { ChunkProtocol, MeshProtocol } from "@voxelize/transport/src/types";
import ndarray, { NdArray } from "ndarray";
import {
  BufferAttribute,
  BufferGeometry,
  Group,
  Material,
  Mesh,
  Scene,
} from "three";

import { Coords2, Coords3 } from "../../types";
import { BlockUtils, ChunkUtils, LightColor, LightUtils } from "../../utils";

import { BlockRotation } from "./block";

/**
 * Parameters to construct a new chunk.
 */
export type ChunkParams = {
  /**
   * The horizontal dimensions of the chunk, in blocks. This configuration is
   * loaded from the server's world config.
   */
  size: number;

  /**
   * The vertical height of the chunk, in blocks. This configuration is
   * loaded from the server's world config.
   */
  maxHeight: number;

  /**
   * The vertical segments of the chunk, in blocks. This configuration is
   * loaded from the server's world config.
   */
  subChunks: number;
};

/**
 * A chunk's mesh. This is a group of sub-chunks, each with their own mesh generated by the server.
 *
 * This module is used internally by the `Chunk` class.
 *
 * @noInheritDoc
 */
export class ChunkMesh extends Group {
  /**
   * The map for opaque sub-chunk meshes in this chunk.
   */
  public opaque = new Map<number, Mesh>();

  /**
   * The map for transparent sub-chunk meshes in this chunk. Transparent meshes are deeper separated
   * into individual block types within each sub-chunk.
   */
  public transparent = new Map<number, Mesh[][]>();

  /**
   * Create a new chunk mesh.
   *
   * @param chunk The chunk to link this chunk mesh to.
   */
  constructor(public chunk: Chunk) {
    super();
  }

  /**
   * Set the chunk mesh's data from a protocol.
   *
   * @param meshData The data generated from the server.
   * @param materials The shared chunk materials.
   */
  set = (
    meshData: MeshProtocol,
    materials: {
      opaque?: Material;
      transparent?: {
        front: Material;
        back: Material;
      };
    }
  ) => {
    let { level } = meshData;

    if (!level) {
      level = 0;
    }

    const partition = this.chunk.params.maxHeight / this.chunk.params.subChunks;

    // Process opaque meshes first
    (() => {
      if (!meshData.opaque) return;
      const { opaque } = meshData;
      const map = this.opaque;

      // If opaque DNE, means used to be a mesh but now there isn't. Remove it.
      if (!opaque) {
        const existing = map.get(level);

        if (existing) {
          this.remove(existing);
        }

        return;
      }

      const { positions, indices, uvs, lights } = opaque;

      // No mesh actually
      if (positions.length === 0 || indices.length === 0) {
        return;
      }

      // Process it.
      let mesh = map.get(level) as Mesh;

      if (!mesh) {
        mesh = new Mesh(new BufferGeometry(), materials.opaque);
        mesh.name = `${this.chunk.name}-opaque`;
        mesh.matrixAutoUpdate = false;
        mesh.userData.isChunk = true;
        mesh.position.set(
          this.chunk.min[0],
          level * partition,
          this.chunk.min[2]
        );
        mesh.updateMatrix();
        map.set(level, mesh);
      }

      if (!mesh.parent) {
        this.add(mesh);
      }

      const geometry = mesh.geometry;

      geometry.setAttribute(
        "position",
        new BufferAttribute(new Float32Array(positions), 3)
      );
      geometry.setAttribute(
        "uv",
        new BufferAttribute(new Float32Array(uvs), 2)
      );
      geometry.setAttribute(
        "light",
        new BufferAttribute(new Int32Array(lights), 1)
      );
      geometry.setIndex(Array.from(new Uint32Array(indices)));

      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
    })();

    // Process transparent meshes next
    (() => {
      if (!meshData.transparent) return;

      const { transparent } = meshData;
      const map = this.transparent;

      // If transparent DNE, means used to be a mesh but now there isn't. Remove it.
      const existing = map.get(level);
      if (existing) {
        existing.forEach((meshes) => {
          meshes.forEach((mesh) => {
            this.remove(mesh);
          });
        });
      }
      map.delete(level);

      const arr = transparent
        .map((meshData) => {
          const meshes = [];

          ["front", "back"].forEach((side) => {
            const { positions, indices, uvs, lights } = meshData;

            // No mesh actually
            if (positions.length === 0 || indices.length === 0) {
              return;
            }

            const mesh = new Mesh(
              new BufferGeometry(),
              materials.transparent[side]
            );

            const geometry = mesh.geometry;

            geometry.setAttribute(
              "position",
              new BufferAttribute(new Float32Array(positions), 3)
            );
            geometry.setAttribute(
              "uv",
              new BufferAttribute(new Float32Array(uvs), 2)
            );
            geometry.setAttribute(
              "light",
              new BufferAttribute(new Int32Array(lights), 1)
            );
            geometry.setIndex(Array.from(new Uint32Array(indices)));

            geometry.computeBoundingBox();
            geometry.computeBoundingSphere();

            mesh.name = `${this.chunk.name}-transparent`;
            mesh.matrixAutoUpdate = false;
            mesh.userData.isChunk = true;
            mesh.position.set(
              this.chunk.min[0] + (side === "front" ? 0 : 0.001),
              level * partition + (side === "front" ? 0 : 0.001),
              this.chunk.min[2] + (side === "front" ? 0 : 0.001)
            );
            mesh.updateMatrix();

            meshes.push(mesh);
            this.add(mesh);
          });

          return meshes;
        })
        .filter(Boolean);

      map.set(level, arr);
    })();
  };

  /**
   * Dispose the geometries of the chunk mesh.
   */
  dispose = () => {
    this.opaque.forEach((mesh) => {
      mesh.geometry.dispose();
    });

    this.transparent.forEach((groups) => {
      groups.forEach((group) => {
        group.forEach((mesh) => {
          mesh.geometry?.dispose();
        });
      });
    });
  };

  /**
   * Whether or not the chunk mesh is empty.
   */
  get isEmpty() {
    return this.opaque.size === 0 && this.transparent.size === 0;
  }
}

/**
 * A chunk is a `chunkSize` x `maxHeight` x `chunkSize` region of blocks. The data of each chunk is generated
 * and sent from the server to the client, then the client renders the chunks surrounding the client.
 *
 * ![Chunk](/img/docs/chunk.png)
 *
 */
export class Chunk {
  /**
   * Parameters to create a new chunk.
   */
  public params: ChunkParams;

  /**
   * The ID of the chunk generated on the server-side.
   */
  public id: string;

  /**
   * The chunk's mesh, which is a group of sub-chunks.
   */
  public mesh: ChunkMesh;

  /**
   * The name of the chunk, which is converted from the chunk's coordinates into a string representation
   * through {@link ChunkUtils.getChunkName}.
   */
  public name: string;

  /**
   * The chunk's 2D coordinates in the word. This coordinate is the voxel coordinate divided by the chunk size then floored.
   */
  public coords: Coords2;

  /**
   * The minimum 3D voxel coordinate within this chunk, inclusive.
   */
  public min: Coords3;

  /**
   * The maximum 3D voxel coordinate within this chunk, exclusive.
   */
  public max: Coords3;

  /**
   * The voxel data within this chunk, represented by a 1D n-dimensional array.
   */
  public voxels: NdArray<Uint32Array>;

  /**
   * The lighting data within this chunk, represented by a 1D n-dimensional array.
   */
  public lights: NdArray<Uint32Array>;

  /**
   * Whether or not the chunk has been added to the world.
   */
  public added = false;

  /**
   * Create a new chunk with the given parameters.
   *
   * @param id The ID of the chunk generated on the server-side.
   * @param x The x coordinate of the chunk.
   * @param z The z coordinate of the chunk.
   * @param params The parameters to create a new chunk.
   */
  constructor(id: string, x: number, z: number, params: ChunkParams) {
    this.id = id;
    this.params = params;

    this.name = ChunkUtils.getChunkName([x, z]);
    this.coords = [x, z];

    const { size, maxHeight } = params;

    this.voxels = ndarray([] as any, [size, maxHeight, size]);
    this.lights = ndarray([] as any, [size, maxHeight, size]);

    this.min = [x * size, 0, z * size];
    this.max = [(x + 1) * size, maxHeight, (z + 1) * size];

    this.mesh = new ChunkMesh(this);
  }

  /**
   * Build the chunk mesh from the voxel data.
   *
   * @param data The chunk protocol data received from the server.
   * @param materials The materials to use for the chunk mesh.
   * @param materials.opaque The opaque material to use for the chunk mesh.
   * @param materials.transparent The transparent materials to use for the chunk mesh.
   * @returns A promise that resolves when the chunk mesh is generated.
   */
  build = async (
    data: ChunkProtocol,
    materials: {
      opaque?: Material;
      transparent?: {
        /**
         * The material to use for the transparent front side of the chunk mesh.
         */
        front: Material;

        /**
         * The material to use for the transparent back side of the chunk mesh.
         */
        back: Material;
      };
    }
  ) => {
    const { meshes, lights, voxels } = data;

    if (lights && lights.byteLength) this.lights.data = new Uint32Array(lights);
    if (voxels && voxels.byteLength) this.voxels.data = new Uint32Array(voxels);

    return new Promise<void>((resolve) => {
      if (meshes) {
        let frame = 0;

        const update = (index = 0) => {
          const data = meshes[index];

          if (data) {
            this.mesh.set(data, materials);
            frame = requestAnimationFrame(() => {
              update(index + 1);
            });
          } else {
            cancelAnimationFrame(frame);
            resolve();
            return;
          }
        };

        update();
      } else {
        resolve();
      }
    });
  };

  /**
   * Add this chunk to a scene. If the chunk has already been added, this method does nothing.
   *
   * @param scene The scene to add the chunk mesh to.
   */
  addToScene = (scene: Scene) => {
    if (!this.added) scene.add(this.mesh);
    this.added = true;
  };

  /**
   * Remove this chunk from a scene. If the chunk has already been removed, this method does nothing.
   *
   * @param scene The scene to remove the chunk mesh from.
   */
  removeFromScene = (scene: Scene) => {
    if (this.added) scene.remove(this.mesh);
    this.added = false;
  };

  /**
   * Get the raw voxel value at a given voxel coordinate.
   *
   * @param vx The x voxel coordinate.
   * @param vy The y voxel coordinate.
   * @param vz The z voxel coordinate.
   * @returns The raw voxel value at the given voxel coordinate. If the voxel is not within
   * the chunk, this method returns `0`.
   */
  getRawValue = (vx: number, vy: number, vz: number) => {
    if (!this.contains(vx, vy, vz)) {
      return 0;
    }

    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    return this.voxels.get(lx, ly, lz);
  };

  /**
   * Set the raw voxel value at a given voxel coordinate.
   *
   * Note: This method is purely client-side and does not affect the actual values on the server.
   *
   * @param vx The x voxel coordinate.
   * @param vy The y voxel coordinate.
   * @param vz The z voxel coordinate.
   * @param value The raw voxel value to set at the given voxel coordinate.
   * @returns The raw voxel value at the given voxel coordinate.
   */
  setRawValue = (vx: number, vy: number, vz: number, val: number) => {
    if (!this.contains(vx, vy, vz)) return 0;
    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    return this.voxels.set(lx, ly, lz, val);
  };

  /**
   * Set the raw light value at a given voxel coordinate.
   *
   * Note: This method is purely client-side and does not affect the actual values on the server.
   *
   * @param vx The x voxel coordinate.
   * @param vy The y voxel coordinate.
   * @param vz The z voxel coordinate.
   * @param level The raw light level to set at the given voxel coordinate.
   * @returns The raw light level at the given voxel coordinate.
   */
  setRawLight = (vx: number, vy: number, vz: number, level: number) => {
    if (!this.contains(vx, vy, vz)) return 0;
    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    return this.lights.set(lx, ly, lz, level);
  };

  /**
   * Get the voxel type ID at a given voxel coordinate.
   *
   * @param vx The x voxel coordinate.
   * @param vy The y voxel coordinate.
   * @param vz The z voxel coordinate.
   * @returns The voxel type ID at the given voxel coordinate.
   */
  getVoxel = (vx: number, vy: number, vz: number) => {
    return BlockUtils.extractID(this.getRawValue(vx, vy, vz));
  };

  /**
   * Set the voxel type ID at a given voxel coordinate.
   *
   * Note: This method is purely client-side and does not affect the actual values on the server.
   *
   * @param vx The x voxel coordinate.
   * @param vy The y voxel coordinate.
   * @param vz The z voxel coordinate.
   * @param id The voxel type ID to set at the given voxel coordinate.
   * @returns The voxel type ID at the given voxel coordinate.
   */
  setVoxel = (vx: number, vy: number, vz: number, id: number) => {
    const value = BlockUtils.insertID(0, id);
    this.setRawValue(vx, vy, vz, value);
    return id;
  };

  /**
   * Get the voxel rotation at a given voxel coordinate.
   *
   * @param vx The x voxel coordinate.
   * @param vy The y voxel coordinate.
   * @param vz The z voxel coordinate.
   * @returns The voxel rotation at the given voxel coordinate.
   */
  getVoxelRotation = (vx: number, vy: number, vz: number) => {
    if (!this.contains(vx, vy, vz)) return new BlockRotation(0, 0);
    return BlockUtils.extractRotation(this.getRawValue(vx, vy, vz));
  };

  /**
   * Set the voxel rotation at a given voxel coordinate.
   *
   * Note: This method is purely client-side and does not affect the actual values on the server.
   *
   * @param vx The x voxel coordinate.
   * @param vy The y voxel coordinate.
   * @param vz The z voxel coordinate.
   * @param rotation The voxel rotation to set at the given voxel coordinate.
   */
  setVoxelRotation = (
    vx: number,
    vy: number,
    vz: number,
    rotation: BlockRotation
  ) => {
    const value = BlockUtils.insertRotation(
      this.getRawValue(vx, vy, vz),
      rotation
    );
    this.setRawValue(vx, vy, vz, value);
  };

  /**
   * Get the voxel stage at a given voxel coordinate.
   *
   * @param vx The x voxel coordinate.
   * @param vy The y voxel coordinate.
   * @param vz The z voxel coordinate.
   * @returns The voxel stage at the given voxel coordinate.
   */
  getVoxelStage = (vx: number, vy: number, vz: number) => {
    if (!this.contains(vx, vy, vz)) return 0;
    return BlockUtils.extractStage(this.getRawValue(vx, vy, vz));
  };

  /**
   * Set the voxel stage at a given voxel coordinate.
   *
   * Note: This method is purely client-side and does not affect the actual values on the server.
   *
   * @param vx The x voxel coordinate.
   * @param vy The y voxel coordinate.
   * @param vz The z voxel coordinate.
   * @param stage The voxel stage to set at the given voxel coordinate.
   * @returns The voxel stage at the given voxel coordinate.
   */
  setVoxelStage = (vx: number, vy: number, vz: number, stage: number) => {
    const value = BlockUtils.insertStage(this.getRawValue(vx, vy, vz), stage);
    this.setRawValue(vx, vy, vz, value);
    return stage;
  };

  /**
   * Get the red light level at a given voxel coordinate.
   *
   * @param vx The x voxel coordinate.
   * @param vy The y voxel coordinate.
   * @param vz The z voxel coordinate.
   * @returns The red light level at the given voxel coordinate. If the voxel coordinate is out of bounds, returns 0.
   */
  getRedLight = (vx: number, vy: number, vz: number) => {
    if (!this.contains(vx, vy, vz)) {
      return 0;
    }

    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    return this.getLocalRedLight(lx, ly, lz);
  };

  /**
   * Set the red light level at a given voxel coordinate.
   *
   * Note: This method is purely client-side and does not affect the actual values on the server.
   *
   * @param vx The x voxel coordinate
   * @param vy The y voxel coordinate
   * @param vz The z voxel coordinate
   * @param level The red light level to set at the given voxel coordinate.
   * @returns The red light level at the given voxel coordinate. If the voxel coordinate is out of bounds, returns 0.
   */
  setRedLight = (vx: number, vy: number, vz: number, level: number) => {
    if (!this.contains(vx, vy, vz)) {
      return 0;
    }

    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    return this.setLocalRedLight(lx, ly, lz, level);
  };

  /**
   * Get the green light level at a given voxel coordinate.
   *
   * @param vx The x voxel coordinate
   * @param vy The y voxel coordinate
   * @param vz The z voxel coordinate
   * @returns The green light level at the given voxel coordinate. If the voxel coordinate is out of bounds, returns 0.
   */
  getGreenLight = (vx: number, vy: number, vz: number) => {
    if (!this.contains(vx, vy, vz)) {
      return 0;
    }

    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    return this.getLocalGreenLight(lx, ly, lz);
  };

  /**
   * Set the green light level at a given voxel coordinate.
   *
   * Note: This method is purely client-side and does not affect the actual values on the server.
   *
   * @param vx The x voxel coordinate
   * @param vy The y voxel coordinate
   * @param vz The z voxel coordinate
   * @param level The green light level to set at the given voxel coordinate.
   * @returns The green light level at the given voxel coordinate. If the voxel coordinate is out of bounds, returns 0.
   */
  setGreenLight = (vx: number, vy: number, vz: number, level: number) => {
    if (!this.contains(vx, vy, vz)) {
      return 0;
    }

    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    return this.setLocalGreenLight(lx, ly, lz, level);
  };

  /**
   * Get the blue light level at a given voxel coordinate.
   *
   * @param vx The x voxel coordinate
   * @param vy The y voxel coordinate
   * @param vz The z voxel coordinate
   * @returns The blue light level at the given voxel coordinate. If the voxel coordinate is out of bounds, returns 0.
   */
  getBlueLight = (vx: number, vy: number, vz: number) => {
    if (!this.contains(vx, vy, vz)) {
      return 0;
    }

    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    return this.getLocalBlueLight(lx, ly, lz);
  };

  /**
   * Set the blue light level at a given voxel coordinate.
   *
   * Note: This method is purely client-side and does not affect the actual values on the server.
   *
   * @param vx The x voxel coordinate
   * @param vy The y voxel coordinate
   * @param vz The z voxel coordinate
   * @param level The blue light level to set at the given voxel coordinate.
   * @returns The blue light level at the given voxel coordinate. If the voxel coordinate is out of bounds, returns 0.
   */
  setBlueLight = (vx: number, vy: number, vz: number, level: number) => {
    if (!this.contains(vx, vy, vz)) {
      return 0;
    }

    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    return this.setLocalBlueLight(lx, ly, lz, level);
  };

  /**
   * Get the colored torch light level at a given voxel coordinate.
   *
   * @param vx The x voxel coordinate
   * @param vy The y voxel coordinate
   * @param vz The z voxel coordinate
   * @param color The color of the light to get at the given voxel coordinate.
   * @returns The light level at the given voxel coordinate. If the voxel coordinate is out of bounds, returns 0.
   */
  getTorchLight = (vx: number, vy: number, vz: number, color: LightColor) => {
    switch (color) {
      case "RED":
        return this.getRedLight(vx, vy, vz);
      case "GREEN":
        return this.getGreenLight(vx, vy, vz);
      case "BLUE":
        return this.getBlueLight(vx, vy, vz);
      default:
        throw new Error("Received unknown light color...");
    }
  };

  /**
   * Set the colored torch light level at a given voxel coordinate.
   *
   * Note: This method is purely client-side and does not affect the actual values on the server.
   *
   * @param vx The x voxel coordinate
   * @param vy The y voxel coordinate
   * @param vz The z voxel coordinate
   * @param level The light level to set at the given voxel coordinate.
   * @param color The color of the light to set at the given voxel coordinate.
   * @returns The light level at the given voxel coordinate. If the voxel coordinate is out of bounds, returns 0.
   */
  setTorchLight = (
    vx: number,
    vy: number,
    vz: number,
    level: number,
    color: LightColor
  ) => {
    switch (color) {
      case "RED":
        return this.setRedLight(vx, vy, vz, level);
      case "GREEN":
        return this.setGreenLight(vx, vy, vz, level);
      case "BLUE":
        return this.setBlueLight(vx, vy, vz, level);
      default:
        throw new Error("Received unknown light color...");
    }
  };

  /**
   * Get the sunlight level at a given voxel coordinate.
   *
   * @param vx The x voxel coordinate
   * @param vy The y voxel coordinate
   * @param vz The z voxel coordinate
   * @returns The sunlight level at the given voxel coordinate. If the voxel coordinate is out of bounds, returns 0.
   */
  getSunlight = (vx: number, vy: number, vz: number) => {
    if (!this.contains(vx, vy, vz)) {
      return 0;
    }

    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    return this.getLocalSunlight(lx, ly, lz);
  };

  /**
   * Set the sunlight level at a given voxel coordinate.
   *
   * Note: This method is purely client-side and does not affect the actual values on the server.
   *
   * @param vx The x voxel coordinate
   * @param vy The y voxel coordinate
   * @param vz The z voxel coordinate
   * @param level The sunlight level to set at the given voxel coordinate.
   * @returns The sunlight level at the given voxel coordinate. If the voxel coordinate is out of bounds, returns 0.
   */
  setSunlight = (vx: number, vy: number, vz: number, level: number) => {
    if (!this.contains(vx, vy, vz)) {
      return 0;
    }

    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    return this.setLocalSunlight(lx, ly, lz, level);
  };

  /**
   * Get the horizontal distance from the chunk's center voxel to the given voxel coordinate.
   *
   * @param vx The x voxel coordinate
   * @param _ The y voxel coordinate
   * @param vz The z voxel coordinate
   * @returns The horizontal distance from this chunk's center to the given voxel coordinate.
   */
  distTo = (vx: number, _: number, vz: number) => {
    const [minX, , minZ] = this.min;
    const [maxX, , maxZ] = this.max;

    const mx = (minX + maxX) / 2;
    const mz = (minZ + maxZ) / 2;

    return Math.sqrt(
      (mx + this.params.size / 2 - vx) ** 2 +
        (mz + this.params.size / 2 - vz) ** 2
    );
  };

  /**
   * Dispose the chunk's meshes.
   */
  dispose = () => {
    this.mesh.dispose();
  };

  /**
   * Whether or not is this chunk ready to be rendered and seen in the world.
   */
  get isReady() {
    return (
      (!!this.mesh?.opaque || !!this.mesh?.transparent) &&
      this.lights.data.length !== 0 &&
      this.voxels.data.length !== 0
    );
  }

  private getLocalRedLight = (lx: number, ly: number, lz: number) => {
    return LightUtils.extractRedLight(this.lights.get(lx, ly, lz));
  };

  private setLocalRedLight = (
    lx: number,
    ly: number,
    lz: number,
    level: number
  ) => {
    return this.lights.set(
      lx,
      ly,
      lz,
      LightUtils.insertRedLight(this.lights.get(lx, ly, lz), level)
    );
  };

  private getLocalGreenLight = (lx: number, ly: number, lz: number) => {
    return LightUtils.extractGreenLight(this.lights.get(lx, ly, lz));
  };

  private setLocalGreenLight = (
    lx: number,
    ly: number,
    lz: number,
    level: number
  ) => {
    return this.lights.set(
      lx,
      ly,
      lz,
      LightUtils.insertGreenLight(this.lights.get(lx, ly, lz), level)
    );
  };

  private getLocalBlueLight = (lx: number, ly: number, lz: number) => {
    return LightUtils.extractBlueLight(this.lights.get(lx, ly, lz));
  };

  private setLocalBlueLight = (
    lx: number,
    ly: number,
    lz: number,
    level: number
  ) => {
    return this.lights.set(
      lx,
      ly,
      lz,
      LightUtils.insertBlueLight(this.lights.get(lx, ly, lz), level)
    );
  };

  private getLocalSunlight = (lx: number, ly: number, lz: number) => {
    return LightUtils.extractSunlight(this.lights.get(lx, ly, lz));
  };

  private setLocalSunlight = (
    lx: number,
    ly: number,
    lz: number,
    level: number
  ) => {
    return this.lights.set(
      lx,
      ly,
      lz,
      LightUtils.insertSunlight(this.lights.get(lx, ly, lz), level)
    );
  };

  private toLocal = (vx: number, vy: number, vz: number) => {
    const [mx, my, mz] = this.min;
    return [vx - mx, vy - my, vz - mz];
  };

  private contains = (vx: number, vy: number, vz: number) => {
    const { size, maxHeight } = this.params;
    const [lx, ly, lz] = this.toLocal(vx, vy, vz);

    return lx < size && ly >= 0 && ly < maxHeight && lz >= 0 && lz < size;
  };
}

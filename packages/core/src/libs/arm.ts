import * as THREE from "three";

import { Inputs } from "../core/inputs";
import { AnimationUtils } from "../utils";

import { CanvasBox } from "./canvas-box";
import { defaultArmsOptions } from "./character";

const ARM_POSITION = new THREE.Vector3(1, -1, -1);
const ARM_QUATERION = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(-Math.PI / 4, 0, -Math.PI / 8)
);
const BLOCK_POSITION = new THREE.Vector3(1, -1.8, -2);
const BLOCK_QUATERNION = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(0, 1, 0),
  -Math.PI / 4
);

const SWING_TIMES = [0, 0.05, 0.1, 0.15, 0.2, 0.3];

const SWING_POSITIONS_DELTA = [
  new THREE.Vector3(-0.34, 0.23, 0),
  new THREE.Vector3(0, -0.25, 0),
  new THREE.Vector3(0, -0.68, 0),
  new THREE.Vector3(0, -0.3, 0),
];

const generateSwingPositions = (initialPosition: THREE.Vector3) => {
  const positions = [];
  for (let i = 0; i < SWING_POSITIONS_DELTA.length; i++) {
    const nextPosition = (
      i === 0 ? initialPosition.clone() : positions[i - 1].clone()
    ).add(SWING_POSITIONS_DELTA[i]);
    positions.push(nextPosition);
  }
  return positions;
};

const ARM_SWING_POSITIONS = generateSwingPositions(ARM_POSITION);

const BLOCK_SWING_POSITIONS = generateSwingPositions(BLOCK_POSITION);

const SWING_QUATERNIONS = [
  new THREE.Quaternion(-0.41, -0.0746578340503426, 0.21, 0.9061274463528878),
  new THREE.Quaternion(-0.41, -0.0746578340503426, 0.52, 0.9061274463528878),
  new THREE.Quaternion(-0.41, -0.0746578340503426, 0.75, 0.9061274463528878),
  new THREE.Quaternion(
    -0.37533027751786524,
    -0.0746578340503426,
    -0.18023995550173696,
    0.9061274463528878
  ),
];

export type ArmOptions = {
  armObject?: THREE.Object3D;
  armPosition?: THREE.Vector3;
  armQuaternion?: THREE.Quaternion;
  blockPosition?: THREE.Vector3;
  blockQuaternion?: THREE.Quaternion;
  armColor?: string | THREE.Color;
};

const defaultOptions: ArmOptions = {
  armObject: undefined,
  armPosition: ARM_POSITION,
  armQuaternion: ARM_QUATERION,
  blockPosition: BLOCK_POSITION,
  blockQuaternion: BLOCK_QUATERNION,
  armColor: defaultArmsOptions.color,
};

export class Arm extends THREE.Group {
  public options: ArmOptions;

  private mixer: THREE.AnimationMixer;

  private armSwingClip: THREE.AnimationClip;

  private blockSwingClip: THREE.AnimationClip;

  private swingAnimation: THREE.AnimationAction;

  /**
   * An internal clock instance for calculating delta time.
   */
  private clock = new THREE.Clock();

  emitSwingEvent: () => void;

  constructor(options: Partial<ArmOptions> = {}) {
    super();

    this.options = {
      ...defaultOptions,
      ...options,
    };

    this.armSwingClip = AnimationUtils.generateClip(
      "armSwing",
      SWING_TIMES,
      this.options.armPosition,
      this.options.armQuaternion,
      ARM_SWING_POSITIONS,
      SWING_QUATERNIONS
    );
    this.blockSwingClip = AnimationUtils.generateClip(
      "blockSwing",
      SWING_TIMES,
      this.options.blockPosition,
      this.options.blockQuaternion,
      BLOCK_SWING_POSITIONS,
      SWING_QUATERNIONS
    );
    this.setArm();
  }

  /**
   * Connect the arm to the given input manager. This will allow the arm to listen to left
   * and right clicks to play arm animations. This function returns a function that when called
   * unbinds the arm's keyboard inputs.
   *
   * @param inputs The {@link Inputs} instance to bind the arm's keyboard inputs to.
   * @param namespace The namespace to bind the arm's keyboard inputs to.
   */
  public connect = (inputs: Inputs, namespace = "*") => {
    const unbindLeftClick = inputs.click("left", this.doSwing, namespace);

    return () => {
      try {
        unbindLeftClick();
      } catch (e) {
        // Ignore.
      }
    };
  };

  /**
   * Set a new object for the arm. If `animate` is true, the transition will be animated.
   *
   * @param object New object for the arm
   * @param animate Whether to animate the transition
   */
  public setArmObject = (
    object: THREE.Object3D | undefined,
    animate: boolean,
    setInitialState = true
  ) => {
    if (!animate) {
      this.clear();

      if (!object) {
        this.setArm();
      } else {
        this.setBlock(object, setInitialState);
      }
    } else {
      // TODO(balta): Create animation of arm coming down and coming back up
    }
  };

  private setArm = () => {
    const arm = new CanvasBox({ width: 0.3, height: 1, depth: 0.3 });
    arm.paint("all", new THREE.Color(this.options.armColor));
    arm.position.set(ARM_POSITION.x, ARM_POSITION.y, ARM_POSITION.z);
    arm.quaternion.multiply(ARM_QUATERION);

    this.mixer = new THREE.AnimationMixer(arm);
    this.swingAnimation = this.mixer.clipAction(this.armSwingClip);
    this.swingAnimation.setLoop(THREE.LoopOnce, 1);
    this.swingAnimation.clampWhenFinished = true;

    this.add(arm);
  };

  private setBlock = (object: THREE.Object3D, setInitialState: boolean) => {
    if (setInitialState) {
      object.position.set(BLOCK_POSITION.x, BLOCK_POSITION.y, BLOCK_POSITION.z);
      object.quaternion.multiply(BLOCK_QUATERNION);

      this.mixer = new THREE.AnimationMixer(object);
      this.swingAnimation = this.mixer.clipAction(this.blockSwingClip);
      this.swingAnimation.setLoop(THREE.LoopOnce, 1);
      this.swingAnimation.clampWhenFinished = true;

      this.add(object);
    } else {
      this.mixer = new THREE.AnimationMixer(object);
      const newClip = AnimationUtils.generateClip(
        "customSwing",
        SWING_TIMES,
        object.position,
        object.quaternion,
        generateSwingPositions(object.position),
        SWING_QUATERNIONS
      );
      this.swingAnimation = this.mixer.clipAction(newClip);
      this.swingAnimation.setLoop(THREE.LoopOnce, 1);
      this.swingAnimation.clampWhenFinished = true;

      this.add(object);
    }
  };

  /**
   *
   * Update the arm's animation. Note that when a arm is attached to a control,
   * `update` is called automatically within the control's update loop.
   */
  public update() {
    // Normalize the delta
    const delta = Math.min(0.1, this.clock.getDelta());

    this.mixer.update(delta);
  }

  /**
   * Perform an arm swing by playing the swing animation and sending an event to the network.
   */
  public doSwing = () => {
    this.playSwingAnimation();
    if (this.emitSwingEvent) {
      this.emitSwingEvent();
    }
  };

  /**
   * Play the "swing" animation.
   */
  private playSwingAnimation = () => {
    if (this.swingAnimation) {
      this.swingAnimation.reset();
      this.swingAnimation.play();
    }
  };
}

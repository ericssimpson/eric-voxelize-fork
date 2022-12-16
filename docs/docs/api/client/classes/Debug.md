---
id: "Debug"
title: "Class: Debug"
sidebar_label: "Debug"
sidebar_position: 0
custom_edit_url: null
---

A class for general debugging purposes in Voxelize, including FPS, value tracking, and real-time value testing.

# Example
```ts
const debug = new VOXELIZE.Debug();

// Track the voxel property of `controls`.
debug.registerDisplay("Position", controls, "voxel");

// Add a function to track sunlight dynamically.
debug.registerDisplay("Sunlight", () => {
  return world.getSunlightByVoxel(...controls.voxel);
});

// In the game loop, trigger debug updates.
debug.update();
```

![Debug](/img/docs/debug.png)

## Hierarchy

- `Group`

  ↳ **`Debug`**

## Constructors

### constructor

• **new Debug**(`domElement?`, `params?`)

Create a new [Debug](Debug.md) instance.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `domElement` | `HTMLElement` | `document.body` | The DOM element to append the debug panel to. |
| `params` | `Partial`<[`DebugParams`](../modules.md#debugparams-2)\> | `{}` | Parameters to create a [Debug](Debug.md) instance. |

#### Overrides

Group.constructor

## Properties

### dataWrapper

• **dataWrapper**: `HTMLDivElement`

The HTML element that wraps all the debug entries and stats.js instance, located
on the top-left by default.

___

### domElement

• **domElement**: `HTMLElement`

The DOM element to append the debug panel to. Defaults to `document.body`.

___

### entriesWrapper

• **entriesWrapper**: `HTMLDivElement`

A HTML element wrapping all registered debug entries.

___

### params

• **params**: [`DebugParams`](../modules.md#debugparams-2)

Parameters to create a [Debug](Debug.md) instance.

___

### stats

• `Optional` **stats**: `Stats`

The stats.js instance, situated in the top-left corner after the data entries.

## Methods

### displayNewline

▸ **displayNewline**(): `this`

Add an empty line to the debug entries for spacing.

#### Returns

`this`

The debug instance for chaining.

___

### displayTitle

▸ **displayTitle**(`title`): `this`

Add a static title to the debug entries for grouping.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `title` | `string` | A title to display. |

#### Returns

`this`

The debug instance for chaining.

___

### registerDisplay

▸ **registerDisplay**(`title`, `object?`, `attribute?`, `formatter?`): `this`

Register a new object attribute to track. Needs to call [update](Debug.md#update-2) in the game loop
to update the value.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `title` | `string` | The title of the debug entry. |
| `object?` | `any` | The object to track. |
| `attribute?` | `string` | The attribute of the object to track. |
| `formatter` | (`str`: `string`) => `string` | A function to format the value of the attribute. |

#### Returns

`this`

The debug instance for chaining.

___

### removeDisplay

▸ **removeDisplay**(`title`): `void`

Remove a registered object attribute from tracking.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `title` | `string` | The title of the debug entry. |

#### Returns

`void`

___

### toggle

▸ **toggle**(`force?`): `void`

Toggle the debug instance on/off.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `force` | `any` | `null` | Whether or not to force the debug panel to be shown/hidden. |

#### Returns

`void`

___

### update

▸ **update**(): `void`

Update the debug entries with the latest values. This should be called in the game loop.

#### Returns

`void`

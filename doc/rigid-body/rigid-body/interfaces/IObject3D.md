[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [rigid-body/rigid-body](../README.md) / IObject3D

# Interface: IObject3D

Defined in: [rigid-body/rigid-body.ts:22](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/rigid-body/rigid-body.ts#L22)

3D 对象接口，用于和外部渲染引擎（如 Three.js,babylon.js...）进行数据交互

## Properties

### position

> **position**: `object`

Defined in: [rigid-body/rigid-body.ts:25](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/rigid-body/rigid-body.ts#L25)

世界空间位置

#### x

> **x**: `number`

#### y

> **y**: `number`

#### z

> **z**: `number`

***

### quaternion

> **quaternion**: `object`

Defined in: [rigid-body/rigid-body.ts:26](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/rigid-body/rigid-body.ts#L26)

四元数表示的旋转

#### w

> **w**: `number`

#### x

> **x**: `number`

#### y

> **y**: `number`

#### z

> **z**: `number`

***

### userData

> **userData**: `any`

Defined in: [rigid-body/rigid-body.ts:23](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/rigid-body/rigid-body.ts#L23)

自定义数据容器，用于关联刚体对象

***

### uuid

> **uuid**: `string`

Defined in: [rigid-body/rigid-body.ts:24](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/rigid-body/rigid-body.ts#L24)

唯一标识，用于区分不同的3D对象

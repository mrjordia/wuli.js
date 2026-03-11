[**wuli.js API文档**](../../README.md)

***

[wuli.js API文档](../../modules.md) / [world](../README.md) / IWorldOptions

# Interface: IWorldOptions

Defined in: [world.ts:42](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/world.ts#L42)

物理世界初始化配置项。
理世界创建时的核心配置，支持自定义宽相位类型、重力、步进间隔等。

## Properties

### broadPhaseType?

> `optional` **broadPhaseType**: `number`

Defined in: [world.ts:46](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/world.ts#L46)

可选，宽相位检测类型（默认BVH），取值见BROAD_PHASE_TYPE

***

### gravity?

> `optional` **gravity**: [`Vec3`](../../common/vec3/classes/Vec3.md)

Defined in: [world.ts:48](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/world.ts#L48)

可选，世界重力向量（默认Vec3(0, -9.8, 0)，标准重力）

***

### intervalInSecond?

> `optional` **intervalInSecond**: `number`

Defined in: [world.ts:50](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/world.ts#L50)

可选，物理步进间隔（秒），默认0.01666（约60FPS）

***

### simulateAnimation()?

> `optional` **simulateAnimation**: (`intervalInMs`) => [`ISimulateAnimation`](ISimulateAnimation.md)

Defined in: [world.ts:44](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/world.ts#L44)

可选，模拟动画控制器工厂方法，入参为步进间隔（毫秒），返回控制器实例

#### Parameters

##### intervalInMs

`number`

#### Returns

[`ISimulateAnimation`](ISimulateAnimation.md)

***

### stats?

> `optional` **stats**: `boolean` \| [`InfoDisplay`](../../common/info-display/classes/InfoDisplay.md)

Defined in: [world.ts:52](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/world.ts#L52)

可选，性能监控开关/实例，true则创建默认InfoDisplay，也可传入自定义实例

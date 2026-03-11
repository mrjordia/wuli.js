[**wuli.js API文档**](../../README.md)

***

[wuli.js API文档](../../modules.md) / [world](../README.md) / ISimulateAnimation

# Interface: ISimulateAnimation

Defined in: [world.ts:29](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/world.ts#L29)

模拟动画控制器接口。
物理世界的动画循环控制器，用于驱动物理步进的定时执行；
需由业务层实现，提供回调绑定、启动/停止控制能力。

## Properties

### callback()

> **callback**: () => `void`

Defined in: [world.ts:31](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/world.ts#L31)

每次动画帧触发的回调（绑定物理世界step方法）

#### Returns

`void`

***

### start()

> **start**: () => `void`

Defined in: [world.ts:33](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/world.ts#L33)

启动动画循环

#### Returns

`void`

***

### stop()

> **stop**: () => `void`

Defined in: [world.ts:35](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/world.ts#L35)

停止动画循环

#### Returns

`void`

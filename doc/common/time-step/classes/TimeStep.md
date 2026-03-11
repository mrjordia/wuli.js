[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [common/time-step](../README.md) / TimeStep

# Class: TimeStep

Defined in: [common/time-step.ts:13](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/time-step.ts#L13)

物理引擎时间步长管理类。
物理引擎中模拟时间的核心管理类，核心作用：
1. 统一封装物理模拟的时间步长参数，保证跨系统时间单位的一致性；
2. 预计算时间步长倒数（invDt）等衍生值，避免模拟过程中重复计算，提升性能；
3. 支持时间步长比率（dtRatio），适配变速模拟、帧率补偿等动态场景；
核心特性：
- 轻量级封装：仅包含核心时间参数，无额外性能开销；
- 安全设计：默认值避免除零错误，构造函数支持灵活初始化；
- 工程化：预计算衍生值，符合物理引擎“空间换时间”的优化思路；
主要应用场景：刚体动力学模拟、约束求解、碰撞检测的时间步控制，适配固定/动态帧率场景。

## Constructors

### Constructor

> **new TimeStep**(`dt?`, `invDt?`, `dtRatio?`): `TimeStep`

Defined in: [common/time-step.ts:53](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/time-step.ts#L53)

构造函数：初始化时间步长参数。
核心初始化逻辑：
1. 按参数赋值dt、invDt、dtRatio，无额外计算逻辑；
2. 建议初始化时保证invDt = 1/dt（dt≠0时），符合工程最佳实践；
3. dtRatio默认1，保证无缩放的基础模拟逻辑。

#### Parameters

##### dt?

`number` = `0`

时间步长（秒），默认0（未初始化）

##### invDt?

`number` = `0`

时间步长倒数，默认0（未初始化）

##### dtRatio?

`number` = `1`

时间步长比率，默认1（标准步长无缩放）

#### Returns

`TimeStep`

## Properties

### dt

> **dt**: `number`

Defined in: [common/time-step.ts:21](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/time-step.ts#L21)

物理模拟单次时间步长（秒）。
物理引擎每一步模拟的时间增量，是模拟的核心时间单位：
- 固定步长场景：通常设为1/60（≈0.0167s）或1/30（≈0.0333s），保证模拟稳定性；
- 动态步长场景：根据实际帧率调整，需配合dtRatio做补偿；
初始值由构造函数指定，默认0（未初始化状态）。

***

### dtRatio

> **dtRatio**: `number`

Defined in: [common/time-step.ts:41](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/time-step.ts#L41)

时间步长比率（当前dt / 基准dt）。
用于时间缩放或帧率补偿的系数：
- 默认值1：使用标准步长，无缩放；
- 大于1：模拟加速（如dtRatio=2表示模拟速度翻倍）；
- 小于1：模拟减速（如dtRatio=0.5表示模拟速度减半）；
典型应用：动态帧率场景下，补偿实际dt与基准dt的偏差，保证模拟速度一致。

***

### invDt

> **invDt**: `number`

Defined in: [common/time-step.ts:31](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/time-step.ts#L31)

时间步长的倒数（1/dt）。
预计算的衍生值，核心作用：
1. 将物理公式中的除法运算转换为乘法，提升计算效率；
2. 避免模拟过程中频繁计算1/dt，减少浮点运算开销；
安全约束：当dt=0时必须设为0，防止除零错误；
初始值由构造函数指定，默认0（未初始化状态）。

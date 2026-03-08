[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [common/info-display](../README.md) / InfoDisplay

# Class: InfoDisplay

Defined in: [common/info-display.ts:10](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/common/info-display.ts#L10)

物理引擎性能信息展示类。
实时采集并计算物理引擎的核心性能指标（FPS、各阶段耗时、刚体/接触数量等），
支持格式化文本输出和数值数组输出，用于调试面板/性能分析工具展示；
核心监控维度：宽/窄相位耗时、约束求解耗时、FPS、刚体/接触/岛屿数量等。

## Constructors

### Constructor

> **new InfoDisplay**(`world`): `InfoDisplay`

Defined in: [common/info-display.ts:54](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/common/info-display.ts#L54)

构造函数：初始化性能监控实例

#### Parameters

##### world

[`World`](../../../world/classes/World.md)

待监控的物理世界实例

#### Returns

`InfoDisplay`

## Accessors

### information

#### Get Signature

> **get** **information**(): `string`

Defined in: [common/info-display.ts:140](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/common/info-display.ts#L140)

获取格式化的性能信息文本（HTML兼容）。

##### Returns

`string`

返回包含宽相位类型、FPS、刚体/接触/岛屿数量、各阶段耗时（当前|最大）的HTML文本

## Methods

### calcBroadPhase()

> **calcBroadPhase**(): `void`

Defined in: [common/info-display.ts:83](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/common/info-display.ts#L83)

计算宽相位检测耗时。
标记宽相位结束时间，并计算宽相位阶段耗时（结束-开始）

#### Returns

`void`

***

### calcEnd()

> **calcEnd**(): `void`

Defined in: [common/info-display.ts:103](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/common/info-display.ts#L103)

计算物理帧最终耗时并更新最大耗时统计。
标记物理帧结束时间，计算求解/总/更新耗时；
统计周期（>100帧）内更新各阶段最大耗时，周期>500帧时重置计数器；
自动更新FPS并递增统计计数器。

#### Returns

`void`

***

### calcNarrowPhase()

> **calcNarrowPhase**(): `void`

Defined in: [common/info-display.ts:92](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/common/info-display.ts#L92)

计算窄相位检测耗时。
标记窄相位结束时间，并计算窄相位阶段耗时（结束-宽相位结束）

#### Returns

`void`

***

### resetMax()

> **resetMax**(): `void`

Defined in: [common/info-display.ts:71](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/common/info-display.ts#L71)

重置所有阶段的最大耗时统计。
统计周期（100帧）结束时自动调用，重置最大耗时为0

#### Returns

`void`

***

### setTime()

> **setTime**(`index`): `void`

Defined in: [common/info-display.ts:63](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/common/info-display.ts#L63)

记录指定阶段的时间戳。
用于标记物理引擎各阶段的开始/结束时间，index默认0

#### Parameters

##### index

`number`

时间戳索引（对应_times数组）

#### Returns

`void`

***

### toArray()

> **toArray**(): `Float32Array`

Defined in: [common/info-display.ts:163](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/common/info-display.ts#L163)

获取性能指标数值数组（供数值分析/可视化）。
实时更新数组值，索引对应关系见_infos属性注释；
适用于外部工具（如图表插件）读取数值进行可视化展示。

#### Returns

`Float32Array`

13长度的浮点数组，包含所有核心性能指标

***

### upFps()

> **upFps**(): `void`

Defined in: [common/info-display.ts:126](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/common/info-display.ts#L126)

更新FPS（每秒帧数）统计。
每帧调用，每秒重置一次帧计数，计算实时FPS值；
临时变量_f[0]=上次统计时间，_f[1]=当前时间，_f[2]=帧计数。

#### Returns

`void`

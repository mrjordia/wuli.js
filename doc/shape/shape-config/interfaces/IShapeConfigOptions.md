[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [shape/shape-config](../README.md) / IShapeConfigOptions

# Interface: IShapeConfigOptions

Defined in: [shape/shape-config.ts:14](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/shape-config.ts#L14)

形状配置项接口。
定义创建ShapeConfig实例的可选配置参数，涵盖碰撞体的位置、旋转、物理属性、碰撞规则、几何体和接触回调等核心配置，
所有参数均为可选（未配置时会使用引擎默认值）。

## Properties

### collisionGroup?

> `optional` **collisionGroup**: `number`

Defined in: [shape/shape-config.ts:49](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/shape-config.ts#L49)

碰撞组。
碰撞分层标识，用于碰撞过滤：只有满足 collisionGroup & collisionMask != 0 的两个碰撞体才会检测碰撞；
通常用二进制位表示不同分组（如0x01表示玩家层，0x02表示敌人层）。

***

### collisionMask?

> `optional` **collisionMask**: `number`

Defined in: [shape/shape-config.ts:55](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/shape-config.ts#L55)

碰撞掩码。
碰撞检测的目标分组掩码，与collisionGroup配合实现碰撞过滤；
例如：collisionMask=0x03 表示检测与0x01、0x02分组的碰撞体的碰撞。

***

### contactCallback?

> `optional` **contactCallback**: [`ContactCallback`](../../../common/contact-callback/classes/ContactCallback.md)

Defined in: [shape/shape-config.ts:67](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/shape-config.ts#L67)

接触回调函数。
碰撞接触时的自定义回调，可用于处理碰撞事件（如播放音效、扣血、触发机关）；
回调函数会在碰撞体开始接触、持续接触、结束接触时被调用。

***

### density?

> `optional` **density**: `number`

Defined in: [shape/shape-config.ts:43](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/shape-config.ts#L43)

密度。
单位体积的质量，用于计算碰撞体的总质量（质量=密度×几何体体积）；
静态几何体（如地形）会忽略密度配置，质量始终为0。

***

### friction?

> `optional` **friction**: `number`

Defined in: [shape/shape-config.ts:31](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/shape-config.ts#L31)

摩擦系数。
取值范围通常为0~1：0表示无摩擦（光滑表面），1表示最大静摩擦；
决定碰撞体接触时的滑动阻力，如球体在地面滚动的减速程度。

***

### geometry

> **geometry**: [`Geometry`](../../geometry/classes/Geometry.md)

Defined in: [shape/shape-config.ts:61](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/shape-config.ts#L61)

碰撞体关联的几何体。
碰撞体的几何形状定义，支持球体、地形、圆柱体等所有继承自Geometry的几何体类型；
几何体类型决定碰撞检测的算法和精度（如地形使用逐三角形射线检测，球体使用几何公式检测）。

***

### position?

> `optional` **position**: `object`

Defined in: [shape/shape-config.ts:19](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/shape-config.ts#L19)

碰撞体初始位置（局部坐标系）。
仅对非地形几何体生效，地形几何体的位置由变换矩阵单独控制，忽略该配置。

#### x

> **x**: `number`

#### y

> **y**: `number`

#### z

> **z**: `number`

***

### restitution?

> `optional` **restitution**: `number`

Defined in: [shape/shape-config.ts:37](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/shape-config.ts#L37)

恢复系数（弹性系数）。
取值范围通常为0~1：0表示完全非弹性碰撞（无反弹），1表示完全弹性碰撞（无能量损失）；
决定碰撞体碰撞后的反弹程度，如皮球落地后的弹起高度。

***

### rotation?

> `optional` **rotation**: `object`

Defined in: [shape/shape-config.ts:25](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/shape-config.ts#L25)

碰撞体初始旋转四元数。
仅对非地形几何体生效，内部会转换为3x3旋转矩阵；
四元数格式：x/y/z为虚部，w为实部，需保证归一化（长度为1）。

#### w

> **w**: `number`

#### x

> **x**: `number`

#### y

> **y**: `number`

#### z

> **z**: `number`

[**wuli.js API文档**](../../README.md)

***

[wuli.js API文档](../../modules.md) / [constant](../README.md) / CONSTANT

# Variable: CONSTANT

> `const` **CONSTANT**: `object`

Defined in: [constant.ts:177](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constant.ts#L177)

物理引擎核心常量配置。
包含物理引擎的所有全局配置参数、阈值、默认值，
覆盖碰撞检测、约束求解、BVH、GJK-EPA、刚体/关节等核心模块。

## Type Declaration

### BOX\_BOX\_DETECTOR\_EDGE\_BIAS\_MULT

> **BOX\_BOX\_DETECTOR\_EDGE\_BIAS\_MULT**: `number` = `1`

盒-盒检测器边缘偏差乘数

### EPA\_TRIANGLE\_COUNT

> **EPA\_TRIANGLE\_COUNT**: `number` = `0`

EPA三角形计数（调试用）

### HALF\_PI

> **HALF\_PI**: `number` = `1.570796326794895`

π/2

### MAT3\_NUM\_CREATIONS

> **MAT3\_NUM\_CREATIONS**: `number` = `0`

Mat3实例创建计数（性能统计用）

### MAT4\_NUM\_CREATIONS

> **MAT4\_NUM\_CREATIONS**: `number` = `0`

Mat4实例创建计数（性能统计用）

### NEGATIVE\_INFINITY

> **NEGATIVE\_INFINITY**: `number` = `Number.NEGATIVE_INFINITY`

负无穷大

### PI

> **PI**: `number` = `3.14159265358979`

圆周率π

### POSITIVE\_INFINITY

> **POSITIVE\_INFINITY**: `number` = `Number.POSITIVE_INFINITY`

正无穷大

### QUAT\_NUM\_CREATIONS

> **QUAT\_NUM\_CREATIONS**: `number` = `0`

Quat实例创建计数（性能统计用）

### SETTING\_ALTERNATIVE\_CONTACT\_POSITION\_CORRECTION\_ALGORITHM

> **SETTING\_ALTERNATIVE\_CONTACT\_POSITION\_CORRECTION\_ALGORITHM**: `number` = `1`

备选接触位置修正算法（1=SPLIT_IMPULSE）

### SETTING\_ANGULAR\_SLOP

> **SETTING\_ANGULAR\_SLOP**: `number` = `0.017453292519943278`

角向容差（弧度，防止旋转浮点误差）

### SETTING\_BVH\_INCREMENTAL\_COLLISION\_THRESHOLD

> **SETTING\_BVH\_INCREMENTAL\_COLLISION\_THRESHOLD**: `number` = `0.45`

BVH增量碰撞阈值

### SETTING\_BVH\_PROXY\_PADDING

> **SETTING\_BVH\_PROXY\_PADDING**: `number` = `0.1`

BVH代理AABB扩展padding（防止高频抖动）

### SETTING\_CONTACT\_ENABLE\_BOUNCE\_THRESHOLD

> **SETTING\_CONTACT\_ENABLE\_BOUNCE\_THRESHOLD**: `number` = `0.5`

接触启用反弹的速度阈值（低于该值不反弹）

### SETTING\_CONTACT\_PERSISTENCE\_THRESHOLD

> **SETTING\_CONTACT\_PERSISTENCE\_THRESHOLD**: `number` = `0.05`

接触持久化阈值（防止接触频繁创建/销毁）

### SETTING\_CONTACT\_USE\_ALTERNATIVE\_POSITION\_CORRECTION\_ALGORITHM\_DEPTH\_THRESHOLD

> **SETTING\_CONTACT\_USE\_ALTERNATIVE\_POSITION\_CORRECTION\_ALGORITHM\_DEPTH\_THRESHOLD**: `number` = `0.05`

接触使用备选位置修正算法的深度阈值

### SETTING\_DEFAULT\_COLLISION\_GROUP

> **SETTING\_DEFAULT\_COLLISION\_GROUP**: `number` = `1`

默认碰撞组

### SETTING\_DEFAULT\_COLLISION\_MASK

> **SETTING\_DEFAULT\_COLLISION\_MASK**: `number` = `1`

默认碰撞掩码

### SETTING\_DEFAULT\_CONTACT\_POSITION\_CORRECTION\_ALGORITHM

> **SETTING\_DEFAULT\_CONTACT\_POSITION\_CORRECTION\_ALGORITHM**: `number` = `0`

默认接触位置修正算法（0=BAUMGARTE）

### SETTING\_DEFAULT\_DENSITY

> **SETTING\_DEFAULT\_DENSITY**: `number` = `1`

默认密度（kg/m³）

### SETTING\_DEFAULT\_FRICTION

> **SETTING\_DEFAULT\_FRICTION**: `number` = `0.2`

默认摩擦系数

### SETTING\_DEFAULT\_GJK\_MARGIN

> **SETTING\_DEFAULT\_GJK\_MARGIN**: `number` = `0.05`

默认GJK容差（防止浮点误差）

### SETTING\_DEFAULT\_JOINT\_CONSTRAINT\_SOLVER\_TYPE

> **SETTING\_DEFAULT\_JOINT\_CONSTRAINT\_SOLVER\_TYPE**: `number` = `0`

默认关节约束求解器类型（0=ITERATIVE）

### SETTING\_DEFAULT\_JOINT\_POSITION\_CORRECTION\_ALGORITHM

> **SETTING\_DEFAULT\_JOINT\_POSITION\_CORRECTION\_ALGORITHM**: `number` = `0`

默认关节位置修正算法（0=BAUMGARTE）

### SETTING\_DEFAULT\_RESTITUTION

> **SETTING\_DEFAULT\_RESTITUTION**: `number` = `0.2`

默认恢复系数（弹性）

### SETTING\_DIRECT\_MLCP\_SOLVER\_EPS

> **SETTING\_DIRECT\_MLCP\_SOLVER\_EPS**: `number` = `1E-9`

直接MLCP求解器精度阈值

### SETTING\_DISABLE\_SLEEPING

> **SETTING\_DISABLE\_SLEEPING**: `boolean` = `false`

是否禁用休眠（调试用）

### SETTING\_ENABLE\_GJK\_CACHING

> **SETTING\_ENABLE\_GJK\_CACHING**: `boolean` = `true`

是否启用GJK缓存（提升检测性能）

### SETTING\_ISLAND\_INITIAL\_CONSTRAINT\_ARRAY\_SIZE

> **SETTING\_ISLAND\_INITIAL\_CONSTRAINT\_ARRAY\_SIZE**: `number` = `128`

岛屿初始约束数组大小（扩容策略：2倍）

### SETTING\_ISLAND\_INITIAL\_RIGID\_BODY\_ARRAY\_SIZE

> **SETTING\_ISLAND\_INITIAL\_RIGID\_BODY\_ARRAY\_SIZE**: `number` = `128`

岛屿初始刚体数组大小（扩容策略：2倍）

### SETTING\_JOINT\_WARM\_STARTING\_FACTOR

> **SETTING\_JOINT\_WARM\_STARTING\_FACTOR**: `number` = `0.95`

通用关节暖启动因子（提升求解收敛速度）

### SETTING\_JOINT\_WARM\_STARTING\_FACTOR\_FOR\_BAUNGARTE

> **SETTING\_JOINT\_WARM\_STARTING\_FACTOR\_FOR\_BAUNGARTE**: `number` = `0.8`

Baumgarte算法关节暖启动因子

### SETTING\_LINEAR\_SLOP

> **SETTING\_LINEAR\_SLOP**: `number` = `0.005`

线性容差（防止浮点误差导致的穿模）

### SETTING\_MAX\_EPA\_POLYHEDRON\_FACES

> **SETTING\_MAX\_EPA\_POLYHEDRON\_FACES**: `number` = `128`

EPA多面体最大面数

### SETTING\_MAX\_EPA\_VERTICES

> **SETTING\_MAX\_EPA\_VERTICES**: `number` = `128`

EPA最大顶点数

### SETTING\_MAX\_JACOBIAN\_ROWS

> **SETTING\_MAX\_JACOBIAN\_ROWS**: `number` = `6`

最大雅可比行数（约束维度）

### SETTING\_MAX\_MANIFOLD\_POINTS

> **SETTING\_MAX\_MANIFOLD\_POINTS**: `number` = `4`

接触流形最大点数（默认4，符合物理引擎通用设计）

### SETTING\_MAX\_ROTATION\_PER\_STEP

> **SETTING\_MAX\_ROTATION\_PER\_STEP**: `number` = `3.14159265358979`

单步最大旋转角度（弧度，防止旋转穿模）

### SETTING\_MAX\_TRANSLATION\_PER\_STEP

> **SETTING\_MAX\_TRANSLATION\_PER\_STEP**: `number` = `20`

单步最大平移距离（防止穿模）

### SETTING\_MIN\_RAG\_DOLL\_MAX\_SWING\_ANGLE

> **SETTING\_MIN\_RAG\_DOLL\_MAX\_SWING\_ANGLE**: `number` = `1E-6`

布娃娃关节最大摆动角度最小值（防止除零）

### SETTING\_MIN\_SPRING\_DAMPER\_DAMPING\_RATIO

> **SETTING\_MIN\_SPRING\_DAMPER\_DAMPING\_RATIO**: `number` = `1E-6`

弹簧阻尼器最小阻尼比（防止除零）

### SETTING\_POSITION\_NGS\_BAUMGARTE

> **SETTING\_POSITION\_NGS\_BAUMGARTE**: `number` = `1.0`

NGS算法鲍姆加特系数（位置修正）

### SETTING\_POSITION\_SPLIT\_IMPULSE\_BAUMGARTE

> **SETTING\_POSITION\_SPLIT\_IMPULSE\_BAUMGARTE**: `number` = `0.4`

分离冲量鲍姆加特系数（位置修正）

### SETTING\_SLEEPING\_ANGULAR\_VELOCITY\_THRESHOLD

> **SETTING\_SLEEPING\_ANGULAR\_VELOCITY\_THRESHOLD**: `number` = `0.5`

休眠角速度阈值（低于该值进入休眠判定）

### SETTING\_SLEEPING\_TIME\_THRESHOLD

> **SETTING\_SLEEPING\_TIME\_THRESHOLD**: `number` = `1.0`

休眠时间阈值（持续低于速度阈值该时间后休眠）

### SETTING\_SLEEPING\_VELOCITY\_THRESHOLD

> **SETTING\_SLEEPING\_VELOCITY\_THRESHOLD**: `number` = `0.2`

休眠线速度阈值（低于该值进入休眠判定）

### SETTING\_VELOCITY\_BAUMGARTE

> **SETTING\_VELOCITY\_BAUMGARTE**: `number` = `0.2`

速度鲍姆加特系数（位置修正）

### TO\_DEGREES

> **TO\_DEGREES**: `number` = `57.29577951308238`

弧度转角度系数（rad→°）

### TO\_RADIANS

> **TO\_RADIANS**: `number` = `0.017453292519943278`

角度转弧度系数（°→rad）

### TWO\_PI

> **TWO\_PI**: `number` = `6.28318530717958`

2π

### VEC3\_NUM\_CREATIONS

> **VEC3\_NUM\_CREATIONS**: `number` = `0`

Vec3实例创建计数（性能统计用）

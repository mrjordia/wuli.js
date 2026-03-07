[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [collision-detector/gjk-epa-detector/epa-polyhedron](../README.md) / EpaPolyhedron

# Class: EpaPolyhedron

Defined in: [collision-detector/gjk-epa-detector/epa-polyhedron.ts:14](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/gjk-epa-detector/epa-polyhedron.ts#L14)

EPA多面体类。
属于EPA（扩展多面体算法）核心数据结构，用于表示碰撞检测中动态扩展的凸多面体，
             管理多面体的顶点集合、三角面链表、三角面/顶点对象池，提供多面体初始化、顶点添加、边环查找、
             拓扑校验等核心操作，是EPA算法求解两个凸体碰撞穿透深度的核心容器

## Constructors

### Constructor

> **new EpaPolyhedron**(): `EpaPolyhedron`

#### Returns

`EpaPolyhedron`

## Properties

### center

> **center**: [`Vec3`](../../../../common/vec3/classes/Vec3.md)

Defined in: [collision-detector/gjk-epa-detector/epa-polyhedron.ts:26](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/gjk-epa-detector/epa-polyhedron.ts#L26)

多面体中心点。
多面体的几何中心点，用于三角面初始化时的朝向判断和法向量计算

***

### numTriangles

> **numTriangles**: `number` = `0`

Defined in: [collision-detector/gjk-epa-detector/epa-polyhedron.ts:50](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/gjk-epa-detector/epa-polyhedron.ts#L50)

有效三角面数量。
记录多面体中实际有效的三角面个数，随三角面添加/移除动态更新

***

### numVertices

> **numVertices**: `number` = `0`

Defined in: [collision-detector/gjk-epa-detector/epa-polyhedron.ts:32](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/gjk-epa-detector/epa-polyhedron.ts#L32)

有效顶点数量。
记录vertices数组中实际有效的顶点个数，随顶点添加动态递增

***

### status

> **status**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<`number`\>

Defined in: [collision-detector/gjk-epa-detector/epa-polyhedron.ts:75](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/gjk-epa-detector/epa-polyhedron.ts#L75)

状态码。
多面体操作的状态标记，不同数值对应不同错误/正常状态：
             - 0: 正常
             - 1: 三角面初始化失败
             - 2: 相邻边索引无效（-1）
             - 3: 相邻三角面为空
             - 4: 边环下一个顶点为空
             - 5: 边环外部三角面为空
             - 6: 三角面不可见（朝向错误）

***

### triangleList

> **triangleList**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`EpaTriangle`](../../epa-triangle/classes/EpaTriangle.md)\>

Defined in: [collision-detector/gjk-epa-detector/epa-polyhedron.ts:38](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/gjk-epa-detector/epa-polyhedron.ts#L38)

三角面链表头节点。
指向多面体三角面双向链表的第一个节点，用于遍历所有三角面

***

### triangleListLast

> **triangleListLast**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`EpaTriangle`](../../epa-triangle/classes/EpaTriangle.md)\>

Defined in: [collision-detector/gjk-epa-detector/epa-polyhedron.ts:44](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/gjk-epa-detector/epa-polyhedron.ts#L44)

三角面链表尾节点。
指向多面体三角面双向链表的最后一个节点，用于快速添加新三角面

***

### trianglePool

> **trianglePool**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`EpaTriangle`](../../epa-triangle/classes/EpaTriangle.md)\>

Defined in: [collision-detector/gjk-epa-detector/epa-polyhedron.ts:56](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/gjk-epa-detector/epa-polyhedron.ts#L56)

三角面对象池。
三角面复用池，存储已销毁的三角面实例，避免频繁创建/销毁对象，优化内存性能

***

### vertexPool

> **vertexPool**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`EpaVertex`](../../epa-vertex/classes/EpaVertex.md)\>

Defined in: [collision-detector/gjk-epa-detector/epa-polyhedron.ts:62](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/gjk-epa-detector/epa-polyhedron.ts#L62)

顶点对象池。
顶点复用池（当前代码未实际使用，预留用于顶点复用优化）

***

### vertices

> **vertices**: `any`[]

Defined in: [collision-detector/gjk-epa-detector/epa-polyhedron.ts:20](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/gjk-epa-detector/epa-polyhedron.ts#L20)

多面体顶点数组。
存储多面体所有顶点的数组，长度由SETTING_MAX_EPA_VERTICES限制，
             索引对应顶点编号，numVertices标记实际有效顶点数量

## Methods

### addVertex()

> **addVertex**(`vertex`, `base`): `boolean`

Defined in: [collision-detector/gjk-epa-detector/epa-polyhedron.ts:266](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/gjk-epa-detector/epa-polyhedron.ts#L266)

向多面体添加新顶点（EPA扩展核心操作）。
核心扩展逻辑：
             1. 将新顶点加入vertices数组，有效顶点数+1；
             2. 调用findEdgeLoop移除不可见三角面，标记新边环；
             3. 遍历边环顶点，为每个边环边创建新三角面（复用对象池或新建）；
             4. 初始化新三角面，建立与边环外部三角面、相邻新三角面的拓扑关联；
             5. 将新三角面加入多面体三角面链表；
             6. 校验多面体拓扑结构，返回操作结果；
             该方法是EPA算法的核心扩展步骤，通过添加新顶点扩展多面体，逼近碰撞穿透方向

#### Parameters

##### vertex

[`EpaVertex`](../../epa-vertex/classes/EpaVertex.md)

待添加的新顶点

##### base

[`EpaTriangle`](../../epa-triangle/classes/EpaTriangle.md)

扩展起始三角面

#### Returns

`boolean`

顶点添加是否成功（true=成功，false=失败）

***

### findEdgeLoop()

> **findEdgeLoop**(`id`, `base`, `_from`): `void`

Defined in: [collision-detector/gjk-epa-detector/epa-polyhedron.ts:141](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/gjk-epa-detector/epa-polyhedron.ts#L141)

查找多面体的边环（递归DFS）。
核心逻辑（EPA扩展的核心步骤）：
             1. 标记当前三角面为已遍历（tmpDfsId=id），避免重复处理；
             2. 计算参考点到三角面的向量，判断三角面是否「可见」（法向量与该向量点积>0）；
             3. 三角面不可见时设置status=6并返回，终止遍历；
             4. 遍历当前三角面的3个相邻三角面，递归判断可见性：
                - 相邻三角面可见：继续递归遍历；
                - 相邻三角面不可见：标记顶点的边环信息（tmpEdgeLoopNext/tmpEdgeLoopOuterTriangle）；
             5. 移除当前三角面的所有相邻关联，将其从链表中删除并回收至对象池；
             该方法用于EPA扩展时，移除不可见的三角面并标记新边环，为添加新顶点做准备

#### Parameters

##### id

`number`

DFS遍历唯一标识ID（避免重复遍历）

##### base

[`EpaTriangle`](../../epa-triangle/classes/EpaTriangle.md)

起始三角面

##### \_from

[`Vec3`](../../../../common/vec3/classes/Vec3.md)

参考点（通常为新增顶点）

#### Returns

`void`

***

### init()

> **init**(`v1`, `v2`, `v3`, `v4`): `boolean`

Defined in: [collision-detector/gjk-epa-detector/epa-polyhedron.ts:223](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/gjk-epa-detector/epa-polyhedron.ts#L223)

初始化四面体（EPA多面体的初始状态）。
核心初始化逻辑：
             1. 初始化状态码为0，设置有效顶点数为4，将4个顶点存入vertices数组；
             2. 计算4个顶点的几何中心点（center），用于三角面朝向判断；
             3. 从对象池获取4个三角面，初始化四面体的4个三角面（每个面3个顶点）；
             4. 建立4个三角面之间的相邻关联（拓扑结构）；
             5. 将4个三角面加入多面体的三角面链表；
             6. 返回初始化状态（status=0表示成功）；
             该方法是EPA算法的起点，构建初始四面体多面体

#### Parameters

##### v1

[`EpaVertex`](../../epa-vertex/classes/EpaVertex.md)

第一个顶点

##### v2

[`EpaVertex`](../../epa-vertex/classes/EpaVertex.md)

第二个顶点

##### v3

[`EpaVertex`](../../epa-vertex/classes/EpaVertex.md)

第三个顶点

##### v4

[`EpaVertex`](../../epa-vertex/classes/EpaVertex.md)

第四个顶点

#### Returns

`boolean`

初始化是否成功（true=成功，false=失败）

***

### validate()

> **validate**(): `boolean`

Defined in: [collision-detector/gjk-epa-detector/epa-polyhedron.ts:87](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/gjk-epa-detector/epa-polyhedron.ts#L87)

校验多面体拓扑结构的合法性。
核心校验逻辑：
             1. 遍历所有三角面，重置顶点的边环临时标记；
             2. 检查每个三角面的3个相邻边索引（adjacentPairIndex）是否为-1（非法）；
             3. 检查每个三角面的3个相邻三角面（adjacentTriangles）是否为空（非法）；
             4. 检测到非法状态时设置对应status并返回false，全部合法则返回true；
             该方法是保证多面体拓扑完整性的关键，避免后续EPA扩展计算出错

#### Returns

`boolean`

拓扑结构是否合法（true=合法，false=非法）

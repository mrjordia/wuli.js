/**
 * 物理引擎模拟状态枚举。
 * 控制物理世界模拟的运行状态
 */
enum SIMULATE_STATE {
	/** 启动物理模拟（定时执行step） */
	START = 4000,
	/** 停止物理模拟 */
	STOP = 4001,
	/** 立即执行一次物理步进（单次step） */
	IMMEDIATELY = 4002,
}

/**
 * 几何体类型枚举。
 * 标识不同的碰撞几何体类型，用于碰撞检测分发
 */
enum GEOMETRY_TYPE {
	/** 空几何体（无效类型） */
	NULL = 1000,
	/** 球体几何体 */
	SPHERE = 1001,
	/** 盒型几何体 */
	BOX = 1002,
	/** 圆柱几何体 */
	CYLINDER = 1003,
	/** 圆锥几何体 */
	CONE = 1004,
	/** 胶囊体几何体 */
	CAPSULE = 1005,
	/** 凸包几何体 */
	CONVEX_HULL = 1006,
	/** 地形几何体（高度场） */
	TERRAIN = 1007,
}

/**
 * 关节类型枚举。
 * 标识不同的关节约束类型，用于关节创建和求解
 */
enum JOINT_TYPE {
	/** 空关节（无效类型） */
	NULL = 2000,
	/** 球关节（万向旋转） */
	SPHERICAL = 2001,
	/** 旋转关节（单轴旋转） */
	REVOLUTE = 2002,
	/** 圆柱关节（单轴旋转+平移） */
	CYLINDRICAL = 2003,
	/** 棱柱关节（单轴平移） */
	PRISMATIC = 2004,
	/** 万向关节（双轴旋转） */
	UNIVERSAL = 2005,
	/** 布娃娃关节（角色骨骼专用） */
	RAG_DOLL = 2006,
	/** 通用关节（多轴约束） */
	GENERIC = 2007,
}

/**
 * 刚体类型枚举。
 * 标识刚体的物理行为类型
 */
enum RIGID_BODY_TYPE {
	/** 动态刚体（受重力/力影响，可移动） */
	DYNAMIC = 3000,
	/** 静态刚体（固定不动，无质量） */
	STATIC = 3001,
	/** 运动学刚体（由代码控制运动，无质量，可推动动态刚体） */
	KINEMATIC = 3002,
}

/**
 * 宽相位检测类型枚举。
 * 标识宽相位碰撞检测的实现类型
 */
enum BROAD_PHASE_TYPE {
	/** 空类型（无效） */
	NULL = 5000,
	/** 暴力检测（遍历所有代理对，性能低） */
	BRUTE_FORCE = 5001,
	/** BVH检测（二叉体积层次树，高性能） */
	BVH = 5002,
}

/**
 * BVH插入策略枚举。
 * BVH树中代理的插入策略，影响BVH构建效率
 */
enum BVH_INSERTION_STRATEGY {
	/** 简单插入（快速，性能一般） */
	SIMPLE = 0,
	/** 最小表面积插入（构建慢，查询效率高） */
	MINIMIZE_SURFACE_AREA = 1,
}

/**
 * EPA多面体状态枚举。
 * GJK-EPA算法中EPA多面体构建的状态码
 */
enum EPA_POLYHEDRON_STATE {
	/** 状态正常 */
	OK = 0,
	/** 无效三角形 */
	INVALID_TRIANGLE = 1,
	/** 无相邻对索引 */
	NO_ADJACENT_PAIR_INDEX = 2,
	/** 无相邻三角形 */
	NO_ADJACENT_TRIANGLE = 3,
	/** 边环断裂 */
	EDGE_LOOP_BROKEN = 4,
	/** 无外层三角形 */
	NO_OUTER_TRIANGLE = 5,
	/** 三角形不可见 */
	TRIANGLE_INVISIBLE = 6,
}

/**
 * GJK-EPA碰撞检测结果状态枚举。
 * GJK-EPA凸体碰撞检测的结果状态码
 */
enum GJK_EPA_RESULT_STATE {
	/** 检测成功 */
	SUCCEEDED = 0,
	/** GJK阶段：无法构建四面体 */
	GJK_FAILED_TO_MAKE_TETRAHEDRON = 1,
	/** GJK阶段：未收敛 */
	GJK_DID_NOT_CONVERGE = 2,
	/** EPA阶段：初始化失败 */
	EPA_FAILED_TO_INIT = 257,
	/** EPA阶段：添加顶点失败 */
	EPA_FAILED_TO_ADD_VERTEX = 258,
	/** EPA阶段：未收敛 */
	EPA_DID_NOT_CONVERGE = 259,
}

/**
 * 位置修正算法枚举。
 * 约束求解中位置修正的算法类型
 */
enum POSITION_CORRECTION_ALGORITHM {
	/** 鲍姆加特算法（经典，简单但可能引入能量） */
	BAUMGARTE = 0,
	/** 分离冲量（避免能量引入，更稳定） */
	SPLIT_IMPULSE = 1,
	/** NGS算法（牛顿迭代法，高精度） */
	NGS = 2,
}

/**
 * 雅可比行位标识枚举。
 * 标识雅可比行是否包含线性/角向约束
 */
enum JACOBIAN_ROW_BIT {
	/** 线性约束已设置 */
	LINEAR_SET = 1,
	/** 角向约束已设置 */
	ANGULAR_SET = 2,
}

/**
 * 约束求解器类型枚举。
 * 约束求解器的实现类型
 */
enum CONSTRAINT_SOLVER_TYPE {
	/** 迭代求解器（PGS/GS，性能好，近似解） */
	ITERATIVE = 0,
	/** 直接求解器（MLCP，高精度，性能低） */
	DIRECT = 1,
}

/**
 * 物理引擎核心常量配置。
 * 包含物理引擎的所有全局配置参数、阈值、默认值，
 * 覆盖碰撞检测、约束求解、BVH、GJK-EPA、刚体/关节等核心模块。
 */
const CONSTANT = {
	// ========================= 盒-盒检测相关 =========================
	/** 盒-盒检测器边缘偏差乘数 */
	BOX_BOX_DETECTOR_EDGE_BIAS_MULT: 1,

	// ========================= 调试/统计相关 =========================
	/** EPA三角形计数（调试用） */
	EPA_TRIANGLE_COUNT: 0,
	/** Vec3实例创建计数（性能统计用） */
	VEC3_NUM_CREATIONS: 0,

	// ========================= 默认物理属性 =========================
	/** 默认摩擦系数 */
	SETTING_DEFAULT_FRICTION: 0.2,
	/** 默认恢复系数（弹性） */
	SETTING_DEFAULT_RESTITUTION: 0.2,
	/** 默认密度（kg/m³） */
	SETTING_DEFAULT_DENSITY: 1,
	/** 默认碰撞组 */
	SETTING_DEFAULT_COLLISION_GROUP: 1,
	/** 默认碰撞掩码 */
	SETTING_DEFAULT_COLLISION_MASK: 1,

	// ========================= 刚体运动限制 =========================
	/** 单步最大平移距离（防止穿模） */
	SETTING_MAX_TRANSLATION_PER_STEP: 20,
	/** 单步最大旋转角度（弧度，防止旋转穿模） */
	SETTING_MAX_ROTATION_PER_STEP: 3.14159265358979,

	// ========================= BVH宽相位相关 =========================
	/** BVH代理AABB扩展padding（防止高频抖动） */
	SETTING_BVH_PROXY_PADDING: 0.1,
	/** BVH增量碰撞阈值 */
	SETTING_BVH_INCREMENTAL_COLLISION_THRESHOLD: 0.45,

	// ========================= GJK-EPA相关 =========================
	/** 默认GJK容差（防止浮点误差） */
	SETTING_DEFAULT_GJK_MARGIN: 0.05,
	/** 是否启用GJK缓存（提升检测性能） */
	SETTING_ENABLE_GJK_CACHING: true,
	/** EPA最大顶点数 */
	SETTING_MAX_EPA_VERTICES: 128,
	/** EPA多面体最大面数 */
	SETTING_MAX_EPA_POLYHEDRON_FACES: 128,

	// ========================= 接触约束相关 =========================
	/** 接触启用反弹的速度阈值（低于该值不反弹） */
	SETTING_CONTACT_ENABLE_BOUNCE_THRESHOLD: 0.5,
	/** 速度鲍姆加特系数（位置修正） */
	SETTING_VELOCITY_BAUMGARTE: 0.2,
	/** 分离冲量鲍姆加特系数（位置修正） */
	SETTING_POSITION_SPLIT_IMPULSE_BAUMGARTE: 0.4,
	/** NGS算法鲍姆加特系数（位置修正） */
	SETTING_POSITION_NGS_BAUMGARTE: 1.0,
	/** 接触使用备选位置修正算法的深度阈值 */
	SETTING_CONTACT_USE_ALTERNATIVE_POSITION_CORRECTION_ALGORITHM_DEPTH_THRESHOLD: 0.05,
	/** 默认接触位置修正算法（0=BAUMGARTE） */
	SETTING_DEFAULT_CONTACT_POSITION_CORRECTION_ALGORITHM: 0,
	/** 备选接触位置修正算法（1=SPLIT_IMPULSE） */
	SETTING_ALTERNATIVE_CONTACT_POSITION_CORRECTION_ALGORITHM: 1,
	/** 接触持久化阈值（防止接触频繁创建/销毁） */
	SETTING_CONTACT_PERSISTENCE_THRESHOLD: 0.05,
	/** 接触流形最大点数（默认4，符合物理引擎通用设计） */
	SETTING_MAX_MANIFOLD_POINTS: 4,

	// ========================= 关节约束相关 =========================
	/** 默认关节约束求解器类型（0=ITERATIVE） */
	SETTING_DEFAULT_JOINT_CONSTRAINT_SOLVER_TYPE: 0,
	/** 默认关节位置修正算法（0=BAUMGARTE） */
	SETTING_DEFAULT_JOINT_POSITION_CORRECTION_ALGORITHM: 0,
	/** Baumgarte算法关节暖启动因子 */
	SETTING_JOINT_WARM_STARTING_FACTOR_FOR_BAUNGARTE: 0.8,
	/** 通用关节暖启动因子（提升求解收敛速度） */
	SETTING_JOINT_WARM_STARTING_FACTOR: 0.95,
	/** 弹簧阻尼器最小阻尼比（防止除零） */
	SETTING_MIN_SPRING_DAMPER_DAMPING_RATIO: 1E-6,
	/** 布娃娃关节最大摆动角度最小值（防止除零） */
	SETTING_MIN_RAG_DOLL_MAX_SWING_ANGLE: 1E-6,

	// ========================= 求解器相关 =========================
	/** 最大雅可比行数（约束维度） */
	SETTING_MAX_JACOBIAN_ROWS: 6,
	/** 直接MLCP求解器精度阈值 */
	SETTING_DIRECT_MLCP_SOLVER_EPS: 1E-9,

	// ========================= 岛屿求解相关 =========================
	/** 岛屿初始刚体数组大小（扩容策略：2倍） */
	SETTING_ISLAND_INITIAL_RIGID_BODY_ARRAY_SIZE: 128,
	/** 岛屿初始约束数组大小（扩容策略：2倍） */
	SETTING_ISLAND_INITIAL_CONSTRAINT_ARRAY_SIZE: 128,

	// ========================= 刚体休眠相关 =========================
	/** 休眠线速度阈值（低于该值进入休眠判定） */
	SETTING_SLEEPING_VELOCITY_THRESHOLD: 0.2,
	/** 休眠角速度阈值（低于该值进入休眠判定） */
	SETTING_SLEEPING_ANGULAR_VELOCITY_THRESHOLD: 0.5,
	/** 休眠时间阈值（持续低于速度阈值该时间后休眠） */
	SETTING_SLEEPING_TIME_THRESHOLD: 1.0,
	/** 是否禁用休眠（调试用） */
	SETTING_DISABLE_SLEEPING: false,

	// ========================= 通用精度相关 =========================
	/** 线性容差（防止浮点误差导致的穿模） */
	SETTING_LINEAR_SLOP: 0.005,
	/** 角向容差（弧度，防止旋转浮点误差） */
	SETTING_ANGULAR_SLOP: 0.017453292519943278,

	// ========================= 数学常量 =========================
	/** Mat3实例创建计数（性能统计用） */
	MAT3_NUM_CREATIONS: 0,
	/** Mat4实例创建计数（性能统计用） */
	MAT4_NUM_CREATIONS: 0,
	/** Quat实例创建计数（性能统计用） */
	QUAT_NUM_CREATIONS: 0,
	/** 正无穷大 */
	POSITIVE_INFINITY: Number.POSITIVE_INFINITY,
	/** 负无穷大 */
	NEGATIVE_INFINITY: Number.NEGATIVE_INFINITY,
	/** 圆周率π */
	PI: 3.14159265358979,
	/** 2π */
	TWO_PI: 6.28318530717958,
	/** π/2 */
	HALF_PI: 1.570796326794895,
	/** 角度转弧度系数（°→rad） */
	TO_RADIANS: 0.017453292519943278,
	/** 弧度转角度系数（rad→°） */
	TO_DEGREES: 57.29577951308238,
};

export {
	CONSTANT,
	SIMULATE_STATE,
	GEOMETRY_TYPE,
	JOINT_TYPE,
	RIGID_BODY_TYPE,
	BROAD_PHASE_TYPE,
	BVH_INSERTION_STRATEGY,
	EPA_POLYHEDRON_STATE,
	GJK_EPA_RESULT_STATE,
	POSITION_CORRECTION_ALGORITHM,
	JACOBIAN_ROW_BIT,
	CONSTRAINT_SOLVER_TYPE,
};
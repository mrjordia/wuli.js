/**
 * 物理引擎核心模块导出（聚合所有公开API）。
 * 轻量级3D物理引擎的顶层导出文件，整合所有核心模块、工具类、约束/碰撞检测/宽相位实现，
 * 对外暴露统一的物理引擎API，便于业务层按需导入使用。
 * @module wuli.js
 */

// ========================= 核心基础模块 =========================
/** 物理世界核心（世界管理、物理步进、刚体/关节管理、物理查询） */
export * from './world';
/** 引擎常量定义（宽相位类型、刚体类型、模拟状态、配置常量等） */
export * from './constant';

// ========================= 刚体相关模块 =========================
/** 刚体核心类（物理实体，包含运动状态、形状、质量等） */
export * from './rigid-body/rigid-body';
/** 刚体初始化配置项（自定义质量、类型、休眠参数等） */
export * from './rigid-body/rigid-body-config';
/** 刚体质量数据（质量、惯性张量、质心等物理属性） */
export * from './rigid-body/mass-data';

// ========================= 形状/几何体模块 =========================
/** 形状抽象类（绑定几何体、变换、刚体等） */
export * from './shape/shape';
/** 几何体抽象类（定义碰撞检测、射线检测接口） */
export * from './shape/geometry';
/** 盒型几何体（AABB包围盒的碰撞实现） */
export * from './shape/box-geometry';
/** AABB几何体（轴对齐包围盒，用于宽相位检测） */
export * from './shape/aabb-geometry';
/** 胶囊体几何体（圆柱+半球的碰撞实现） */
export * from './shape/capsule-geometry';
/** 圆锥几何体（锥形碰撞实现） */
export * from './shape/cone-geometry';
/** 凸几何体（凸形状的基础抽象） */
export * from './shape/convex-geometry';
/** 凸包几何体（基于点集构建的凸形状） */
export * from './shape/convex-hull-geometry';
/** 圆柱几何体（圆柱形碰撞实现） */
export * from './shape/cylinder-geometry';
/** 凸体扫掠几何体（凸体投射检测专用） */
export * from './shape/convex-sweep-geometry';
/** 射线检测命中结果（包含命中点、法向量、比例等） */
export * from './shape/ray-cast-hit';
/** 形状初始化配置项（自定义摩擦、恢复系数等） */
export * from './shape/shape-config';
/** 球体几何体（球形碰撞实现） */
export * from './shape/sphere-geometry';
/** 地形几何体（高度场/地形的碰撞实现） */
export * from './shape/terrain-geometry';

// ========================= 通用工具/基础类 =========================
/** 空值类型定义（Nullable<T> = T | null） */
export * from './common/nullable';
/** AABB包围盒（轴对齐，包含扩容、相交检测等方法） */
export * from './common/aabb';
/** AABB检测回调接口（处理AABB相交结果） */
export * from './common/aabb-test-callback';
/** AABB检测包装器（宽相位AABB检测的回调封装） */
export * from './common/aabb-test-wrapper';
/** 接触回调接口（处理形状接触开始/结束/持续事件） */
export * from './common/contact-callback';
/** 凸体投射包装器（宽相位凸体投射的回调封装） */
export * from './common/convex-cast-wrapper';
/** 性能监控类（统计物理步进各阶段耗时） */
export * from './common/info-display';
/** 岛屿类（物理求解的最小单元，包含刚体+约束） */
export * from './common/island';
/** 3x3矩阵（用于旋转、惯性张量等计算） */
export * from './common/mat3';
/** 通用工具方法（向量/矩阵运算、数据拷贝等） */
export * from './common/method';
/** 四元数（用于3D旋转表示，避免万向锁） */
export * from './common/quat';
/** 射线检测回调抽象类（自定义射线命中处理逻辑） */
export * from './common/ray-cast-callback';
/** 射线检测最近命中回调（筛选最近的相交形状） */
export * from './common/ray-cast-closest';
/** 射线检测包装器（宽相位射线检测的回调封装） */
export * from './common/ray-cast-wrapper';
/** 时间步类（存储dt、invDt、dtRatio等步进参数） */
export * from './common/time-step';
/** 变换类（位置+旋转，描述物体的空间姿态） */
export * from './common/transform';
/** 三维向量（用于位置、方向、力等计算） */
export * from './common/vec3';

// ========================= 接触约束模块 =========================
/** 接触类（形状间接触的核心数据，包含流形、约束等） */
export * from './constraint/contact/contact';
/** 接触约束类（接触的物理约束求解实现） */
export * from './constraint/contact/contact-constraint';
/** 接触冲量类（存储接触的冲量、速度等数据） */
export * from './constraint/contact/contact-impulse';
/** 接触链接类（关联刚体与接触的双向链表节点） */
export * from './constraint/contact/contact-link';
/** 接触管理器（负责接触的创建、更新、销毁） */
export * from './constraint/contact/contact-manager';
/** 接触求解器信息（求解接触约束的参数配置） */
export * from './constraint/contact/contact-solver-info';
/** 接触求解器信息行（单轴的求解参数） */
export * from './constraint/contact/contact-solver-info-row';
/** 接触流形类（存储多个接触点，描述形状间的接触区域） */
export * from './constraint/contact/manifold';
/** 流形点类（单个接触点的详细数据：位置、法向、深度等） */
export * from './constraint/contact/manifold-point';
/** 流形更新器（更新接触流形的核心逻辑） */
export * from './constraint/contact/manifold-updater';

// ========================= 关节约束模块 =========================
/** 基跟踪器（关节旋转/平移的基变换跟踪） */
export * from './constraint/joint/basis-tracker';
/** 圆柱关节（允许绕轴旋转+沿轴平移） */
export * from './constraint/joint/cylindrical-joint';
/** 圆柱关节配置项（自定义轴、限位、马达等） */
export * from './constraint/joint/cylindrical-joint-config';
/** 通用关节（支持多轴旋转/平移的灵活关节） */
export * from './constraint/joint/generic-joint';
/** 通用关节配置项（自定义各轴约束、马达等） */
export * from './constraint/joint/generic-joint-config';
/** 关节抽象类（所有关节的基础，定义约束接口） */
export * from './constraint/joint/joint';
/** 关节基础配置项（锚点、刚体、碰撞是否启用等） */
export * from './constraint/joint/joint-config';
/** 关节冲量类（存储关节的冲量、速度等数据） */
export * from './constraint/joint/joint-impulse';
/** 关节链接类（关联刚体与关节的双向链表节点） */
export * from './constraint/joint/joint-link';
/** 关节求解器信息（求解关节约束的参数配置） */
export * from './constraint/joint/joint-solver-info';
/** 关节求解器信息行（单轴的求解参数） */
export * from './constraint/joint/joint-solver-info-row';
/** 关节求解器质量数据行（单轴的质量矩阵数据） */
export * from './constraint/joint/joint-solver-mass-data-row';
/** 棱柱关节（仅允许沿单轴平移） */
export * from './constraint/joint/prismatic-joint';
/** 棱柱关节配置项（自定义平移轴、限位、马达等） */
export * from './constraint/joint/prismatic-joint-config';
/** 布娃娃关节（用于角色布娃娃系统的灵活关节） */
export * from './constraint/joint/ragdoll-joint';
/** 布娃娃关节配置项（自定义旋转限位、刚度等） */
export * from './constraint/joint/ragdoll-joint-config';
/** 旋转关节（仅允许绕单轴旋转） */
export * from './constraint/joint/revolute-joint';
/** 旋转关节配置项（自定义旋转轴、限位、马达等） */
export * from './constraint/joint/revolute-joint-config';
/** 旋转限位马达（控制关节旋转的限位和马达力） */
export * from './constraint/joint/rotational-limit-motor';
/** 球关节（允许绕任意轴旋转） */
export * from './constraint/joint/spherical-joint';
/** 球关节配置项（自定义旋转限位、刚度等） */
export * from './constraint/joint/spherical-joint-config';
/** 弹簧阻尼器（为关节添加弹簧+阻尼效果） */
export * from './constraint/joint/spring-damper';
/** 平移限位马达（控制关节平移的限位和马达力） */
export * from './constraint/joint/translational-limit-motor';
/** 万向关节（允许绕两个正交轴旋转） */
export * from './constraint/joint/universal-joint';
/** 万向关节配置项（自定义旋转轴、限位等） */
export * from './constraint/joint/universal-joint-config';

// ========================= 约束求解器模块 =========================
/** 约束求解器抽象类（接触/关节约束的求解接口） */
export * from './constraint/solver/constraint-solver';
/** 接触求解器质量数据行（接触约束的质量矩阵数据） */
export * from './constraint/solver/contact-solver-mass-data-row';
/** 雅可比行（约束求解的雅可比矩阵行，描述约束方程） */
export * from './constraint/solver/jacobian-row';
/** PGS接触约束求解器（投影梯度法求解接触约束） */
export * from './constraint/solver/pgs-contact-constraint-solver';
/** PGS关节约束求解器（投影梯度法求解关节约束） */
export * from './constraint/solver/pgs-joint-constraint-solver';

// ========================= 直接求解器子模块 =========================
/** 边界类（直接求解器的边界约束） */
export * from './constraint/solver/direct/boundary';
/** 边界构建信息（直接求解器边界的构建参数） */
export * from './constraint/solver/direct/boundary-build-info';
/** 边界构建器（构建直接求解器的边界约束） */
export * from './constraint/solver/direct/boundary-builder';
/** 边界选择器（选择直接求解器的有效边界） */
export * from './constraint/solver/direct/boundary-selector';
/** 直接关节约束求解器（直接法求解关节约束） */
export * from './constraint/solver/direct/direct-joint-constraint-solver';
/** 质量矩阵（直接求解器的质量矩阵实现） */
export * from './constraint/solver/direct/mass-matrix';

// ========================= 碰撞检测模块 =========================
/** 碰撞检测缓存数据（复用检测数据，提升性能） */
export * from './collision-detector/cached-detector-data';
/** 胶囊体-胶囊体碰撞检测器 */
export * from './collision-detector/capsule-capsule-detector';
/** 碰撞矩阵（控制不同形状间是否启用碰撞检测） */
export * from './collision-detector/collision-matrix';
/** 碰撞检测器抽象类（形状间碰撞检测的接口） */
export * from './collision-detector/detector';
/** 碰撞检测结果（包含接触点、法向、深度等） */
export * from './collision-detector/detector-result';
/** 碰撞检测结果点（单个碰撞点的详细数据） */
export * from './collision-detector/detector-result-point';
/** 球体-盒型碰撞检测器 */
export * from './collision-detector/sphere-box-detector';
/** 球体-胶囊体碰撞检测器 */
export * from './collision-detector/sphere-capsule-detector';
/** 球体-球体碰撞检测器 */
export * from './collision-detector/sphere-sphere-detector';
/** 凸体-地形碰撞检测器 */
export * from './collision-detector/convex-terrain-detector';

// ========================= 盒-盒碰撞检测子模块 =========================
/** 盒-盒碰撞检测器（精准的盒型间碰撞检测） */
export * from './collision-detector/box-box-detector/box-box-detector';
/** 面裁剪器（盒-盒检测中的面裁剪逻辑） */
export * from './collision-detector/box-box-detector/face-clipper';
/** 入射顶点（盒-盒检测中的顶点数据） */
export * from './collision-detector/box-box-detector/incident-vertex';

// ========================= GJK-EPA碰撞检测子模块 =========================
/** EPA多面体（GJK-EPA检测中的多面体数据） */
export * from './collision-detector/gjk-epa-detector/epa-polyhedron';
/** EPA三角形（GJK-EPA检测中的三角形面） */
export * from './collision-detector/gjk-epa-detector/epa-triangle';
/** EPA顶点（GJK-EPA检测中的顶点数据） */
export * from './collision-detector/gjk-epa-detector/epa-vertex';
/** GJK缓存（复用GJK检测的中间数据） */
export * from './collision-detector/gjk-epa-detector/gjk-cache';
/** GJK-EPA核心算法（凸体间碰撞检测的通用算法） */
export * from './collision-detector/gjk-epa-detector/gjk-epa';
/** GJK-EPA碰撞检测器（基于GJK-EPA的通用凸体检测器） */
export * from './collision-detector/gjk-epa-detector/gjk-epa-detector';

// ========================= 宽相位检测模块 =========================
/** 宽相位检测抽象类（粗检测接口，筛选潜在碰撞对） */
export * from './broad-phase/broad-phase';
/** 宽相位代理回调接口（遍历宽相位代理的回调） */
export * from './broad-phase/broad-phase-proxy-callback';
/** 暴力宽相位（遍历所有代理对，简单但性能低） */
export * from './broad-phase/brute-force-broad-phase';
/** 物理代理（宽相位中的形状代理，绑定AABB和形状） */
export * from './broad-phase/physics-proxy';
/** 代理对（宽相位中的潜在碰撞代理对） */
export * from './broad-phase/proxy-pair';

// ========================= BVH宽相位子模块 =========================
/** BVH宽相位（基于二叉体积层次的高效宽相位检测） */
export * from './broad-phase/bvh-broad-phase/bvh-broad-phase';
/** BVH节点（BVH树的节点，包含AABB和子节点/代理） */
export * from './broad-phase/bvh-broad-phase/bvh-node';
/** BVH代理（BVH宽相位中的形状代理） */
export * from './broad-phase/bvh-broad-phase/bvh-proxy';
/** BVH策略（BVH树的构建/更新策略） */
export * from './broad-phase/bvh-broad-phase/bvh-strategy';
/** BVH树（二叉体积层次树，核心数据结构） */
export * from './broad-phase/bvh-broad-phase/bvh-tree';
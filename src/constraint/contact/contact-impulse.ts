/**
 * 接触冲量类。
 * 用于存储物理碰撞接触点的冲量信息，包含法向、切向、副法向、穿透方向冲量，以及冲量作用线的坐标分量
 */
export default class ContactImpulse {
    /**
     * 存储接触冲量各分量的数组。
     * 数组长度固定为7，各索引对应的物理含义如下：
     * | 索引 | 字段名       | 物理含义                     | 单位 |
     * |------|--------------|------------------------------|------|
     * | 0    | impulseN     | 法向（Normal）冲量           | N·s  |
     * | 1    | impulseT     | 切向（Tangent）冲量          | N·s  |
     * | 2    | impulseB     | 副法向（Binormal）冲量       | N·s  |
     * | 3    | impulseP     | 穿透（Penetration）方向冲量  | N·s  |
     * | 4    | impulseLX    | 冲量作用线X坐标分量          | m    |
     * | 5    | impulseLY    | 冲量作用线Y坐标分量          | m    |
     * | 6    | impulseLZ    | 冲量作用线Z坐标分量          | m    |
     */
    public elements = new Float64Array(7);
}

export { ContactImpulse };
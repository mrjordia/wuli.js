[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [constraint/contact/contact-link](../README.md) / ContactLink

# Class: ContactLink

Defined in: [constraint/contact/contact-link.ts:10](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/contact/contact-link.ts#L10)

接触链接类。
用于关联刚体（RigidBody）与碰撞接触（Contact）的双向链表节点，
             是物理引擎中高效管理"刚体-接触"关联关系的核心数据结构，每个Contact实例会通过link1/link2关联两个刚体的ContactLink链表

## Constructors

### Constructor

> **new ContactLink**(): `ContactLink`

#### Returns

`ContactLink`

## Properties

### contact

> **contact**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`Contact`](../../contact/classes/Contact.md)\>

Defined in: [constraint/contact/contact-link.ts:30](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/contact/contact-link.ts#L30)

关联的碰撞接触实例。
指向当前链接对应的Contact实例，通过该属性可从刚体快速定位到具体的碰撞接触数据

#### Default

```ts
null
```

***

### next

> **next**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<`ContactLink`\>

Defined in: [constraint/contact/contact-link.ts:23](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/contact/contact-link.ts#L23)

接触链接链表的下一个节点。
双向链表的后继节点，与prev配合实现链表的遍历、插入、删除操作

#### Default

```ts
null
```

***

### other

> **other**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`RigidBody`](../../../../rigid-body/rigid-body/classes/RigidBody.md)\>

Defined in: [constraint/contact/contact-link.ts:37](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/contact/contact-link.ts#L37)

关联的另一个刚体。
指向碰撞中的另一个刚体（非当前链表所属的刚体），用于快速获取碰撞配对的刚体，避免反向查找

#### Default

```ts
null
```

***

### prev

> **prev**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<`ContactLink`\>

Defined in: [constraint/contact/contact-link.ts:16](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/contact/contact-link.ts#L16)

接触链接链表的上一个节点。
双向链表的前驱节点，用于遍历当前刚体的所有接触链接

#### Default

```ts
null
```

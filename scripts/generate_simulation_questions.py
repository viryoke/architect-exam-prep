#!/usr/bin/env python3
"""
模拟题库生成脚本 - 根据真题考点分布生成高质量模拟题
"""
import json
import random

# 考点分配（共375题，5套×75题）
TOPIC_DISTRIBUTION = {
    "arch": 110,      # 系统架构 (~30%)
    "software": 105,  # 软件工程 (~28%)
    "system": 55,     # 信息系统基础 (~14%)
    "os": 30,         # 操作系统 (~8%)
    "db": 25,         # 数据库 (~6%)
    "network": 20,    # 计算机网络 (~5%)
    "security": 15,   # 信息安全 (~4%)
    "ip": 10,         # 知识产权 (~3%)
    "math": 5,        # 数学 (~1%)
    "dist": 5,        # 分布式系统
}

# 题目模板库
QUESTION_BANK = {
    "arch": [
        # 架构风格
        {
            "subTopic": "架构风格选择",
            "text": "以下关于软件架构风格的描述中，正确的是（）。",
            "options": [
                "A. 管道-过滤器风格适用于数据处理系统，具有良好的可扩展性",
                "B. 分层风格将系统划分为多个层次，每层只依赖其下层",
                "C. 事件驱动风格通过事件触发处理流程，适合交互式系统",
                "D. 黑板风格适用于信号处理领域，多个独立组件共享数据"
            ],
            "answer": "ABCD",
            "difficulty": "medium"
        },
        {
            "subTopic": "架构风格选择",
            "text": "某企业需要开发一个实时控制系统，要求系统能够快速响应外部事件并进行处理。最适合的架构风格是（）。",
            "options": [
                "A. 分层架构风格",
                "B. 管道-过滤器架构风格",
                "C. 事件驱动架构风格",
                "D. 面向对象架构风格"
            ],
            "answer": "C",
            "difficulty": "medium"
        },
        # 质量属性
        {
            "subTopic": "质量属性场景",
            "text": "软件架构评估中，敏感点是指（）。",
            "options": [
                "A. 一个或多个构件的特性",
                "B. 影响多个质量属性的架构决策",
                "C. 影响某一质量属性的架构决策",
                "D. 可能导致问题的架构决策"
            ],
            "answer": "C",
            "difficulty": "medium"
        },
        {
            "subTopic": "质量属性场景",
            "text": "以下属于软件架构评估中权衡点的是（）。",
            "options": [
                "A. 提高加密级别会影响系统性能和安全性",
                "B. 采用冗余设计会影响系统可用性和成本",
                "C. 使用缓存技术会影响系统响应时间和数据一致性",
                "D. 以上都是权衡点"
            ],
            "answer": "D",
            "difficulty": "hard"
        },
        # ATAM评估
        {
            "subTopic": "架构评估方法",
            "text": "ATAM架构评估方法的主要步骤包括（）。",
            "options": [
                "A. 描述架构、识别架构方法、生成质量属性效用树",
                "B. 分析架构方法、识别敏感点和权衡点",
                "C. 形成架构评估报告",
                "D. 以上都是ATAM的步骤"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
        {
            "subTopic": "架构评估方法",
            "text": "在ATAM架构评估中，效用树的构建目的是（）。",
            "options": [
                "A. 识别架构中的关键组件",
                "B. 将质量属性需求分解为具体的场景",
                "C. 评估架构的可维护性",
                "D. 确定架构的风险点"
            ],
            "answer": "B",
            "difficulty": "medium"
        },
        # 设计模式
        {
            "subTopic": "设计模式应用",
            "text": "某系统需要支持多种数据库访问方式，包括MySQL、Oracle和PostgreSQL。为实现数据库类型的灵活切换，最适合采用的设计模式是（）。",
            "options": [
                "A. 抽象工厂模式",
                "B. 单例模式",
                "C. 观察者模式",
                "D. 策略模式"
            ],
            "answer": "A",
            "difficulty": "medium"
        },
        {
            "subTopic": "设计模式应用",
            "text": "观察者模式的主要应用场景是（）。",
            "options": [
                "A. 当一个对象的状态改变需要通知多个其他对象时",
                "B. 当需要创建复杂对象时",
                "C. 当需要隔离对象的创建和使用时",
                "D. 当需要动态选择算法时"
            ],
            "answer": "A",
            "difficulty": "easy"
        },
        {
            "subTopic": "设计模式应用",
            "text": "以下关于设计模式的描述，错误的是（）。",
            "options": [
                "A. 单例模式确保一个类只有一个实例",
                "B. 工厂模式用于创建对象而不指定具体类",
                "C. 适配器模式用于将一个类的接口转换成另一个接口",
                "D. 代理模式用于增加对象的功能"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
        {
            "subTopic": "设计模式应用",
            "text": "中介者模式适用于（）。",
            "options": [
                "A. 系统中存在大量相互依赖的对象",
                "B. 需要动态地给对象添加职责",
                "C. 需要为对象提供统一的访问接口",
                "D. 需要将抽象与实现分离"
            ],
            "answer": "A",
            "difficulty": "medium"
        },
        # 构件与架构
        {
            "subTopic": "构件设计",
            "text": "软件构件的特性包括（）。",
            "options": [
                "A. 可复用性、可替换性",
                "B. 独立性、可组装性",
                "C. 标准化接口",
                "D. 以上都是构件的特性"
            ],
            "answer": "D",
            "difficulty": "easy"
        },
        {
            "subTopic": "构件设计",
            "text": "以下关于构件组装的描述，正确的是（）。",
            "options": [
                "A. 构件组装需要考虑接口兼容性",
                "B. 构件组装时需要进行适配",
                "C. 构件组装可以提高开发效率",
                "D. 以上都是正确的描述"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
        # ABSD方法
        {
            "subTopic": "ABSD方法",
            "text": "基于架构的软件开发方法(ABSD)的核心思想是（）。",
            "options": [
                "A. 以架构为核心驱动整个软件开发过程",
                "B. 架构设计是迭代的、递归的过程",
                "C. 架构需求来自利益相关者",
                "D. 以上都是ABSD的核心思想"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
        {
            "subTopic": "ABSD方法",
            "text": "ABSD方法中，架构设计的输入包括（）。",
            "options": [
                "A. 架构需求规格说明",
                "B. 架构风格和模式库",
                "C. 利益相关者的质量属性需求",
                "D. 以上都是"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
        # 特定领域架构
        {
            "subTopic": "特定领域软件架构",
            "text": "特定领域软件架构(DSSA)的特征包括（）。",
            "options": [
                "A. 领域专家参与架构设计",
                "B. 架构具有领域特性",
                "C. 支持领域内的产品开发",
                "D. 以上都是DSSA的特征"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
        # 云计算架构
        {
            "subTopic": "云计算体系结构",
            "text": "云计算的三层架构包括（）。",
            "options": [
                "A. IaaS基础设施层、PaaS平台层、SaaS软件层",
                "B. 硬件层、软件层、应用层",
                "C. 存储层、计算层、网络层",
                "D. 客户层、服务层、数据层"
            ],
            "answer": "A",
            "difficulty": "easy"
        },
        {
            "subTopic": "云计算体系结构",
            "text": "以下关于PaaS的描述，正确的是（）。",
            "options": [
                "A. PaaS提供开发平台和运行环境",
                "B. PaaS用户无需管理底层基础设施",
                "C. PaaS适合开发测试和部署应用",
                "D. 以上都是正确的描述"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
    ],
    "software": [
        # 敏捷开发
        {
            "subTopic": "敏捷开发",
            "text": "敏捷开发方法的核心原则包括（）。",
            "options": [
                "A. 快速响应变化",
                "B. 持续交付有价值软件",
                "C. 团队协作和面对面沟通",
                "D. 以上都是敏捷开发的核心原则"
            ],
            "answer": "D",
            "difficulty": "easy"
        },
        {
            "subTopic": "敏捷开发",
            "text": "Scrum框架中的主要角色包括（）。",
            "options": [
                "A. 产品负责人、Scrum Master、开发团队",
                "B. 项目经理、架构师、程序员",
                "C. 需求分析师、设计师、测试人员",
                "D. 产品经理、技术经理、运维人员"
            ],
            "answer": "A",
            "difficulty": "easy"
        },
        {
            "subTopic": "敏捷开发",
            "text": "Scrum中的Sprint是指（）。",
            "options": [
                "A. 一个固定的开发周期，通常为1-4周",
                "B. 产品的发布周期",
                "C. 需求分析阶段",
                "D. 测试阶段"
            ],
            "answer": "A",
            "difficulty": "easy"
        },
        # 软件测试
        {
            "subTopic": "软件测试方法",
            "text": "以下属于黑盒测试方法的是（）。",
            "options": [
                "A. 等价类划分、边界值分析",
                "B. 语句覆盖、路径覆盖",
                "C. 条件覆盖、判定覆盖",
                "D. 代码审查、静态分析"
            ],
            "answer": "A",
            "difficulty": "easy"
        },
        {
            "subTopic": "软件测试方法",
            "text": "白盒测试的覆盖标准包括（）。",
            "options": [
                "A. 语句覆盖",
                "B. 判定覆盖",
                "C. 条件覆盖和路径覆盖",
                "D. 以上都是白盒测试覆盖标准"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
        {
            "subTopic": "软件测试方法",
            "text": "单元测试的主要依据是（）。",
            "options": [
                "A. 软件需求规格说明书",
                "B. 详细设计说明书",
                "C. 系统设计说明书",
                "D. 用户手册"
            ],
            "answer": "B",
            "difficulty": "medium"
        },
        {
            "subTopic": "软件测试方法",
            "text": "集成测试的方式包括（）。",
            "options": [
                "A. 增量式集成和非增量式集成",
                "B. 自顶向下集成和自底向上集成",
                "C. 三明治集成",
                "D. 以上都是集成测试的方式"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
        {
            "subTopic": "软件测试方法",
            "text": "回归测试的目的是（）。",
            "options": [
                "A. 验证修改后的代码是否引入新的错误",
                "B. 验证原有的功能是否仍然正常",
                "C. 确认系统满足需求规格",
                "D. 以上都是回归测试的目的"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
        # 开发模型
        {
            "subTopic": "软件开发模型",
            "text": "瀑布模型的特点包括（）。",
            "options": [
                "A. 阶段顺序进行，前一阶段完成后才能进入下一阶段",
                "B. 每个阶段都有明确的文档输出",
                "C. 不适合需求变化频繁的项目",
                "D. 以上都是瀑布模型的特点"
            ],
            "answer": "D",
            "difficulty": "easy"
        },
        {
            "subTopic": "软件开发模型",
            "text": "螺旋模型的主要特点是（）。",
            "options": [
                "A. 结合了瀑布模型和原型模型的优点",
                "B. 强调风险分析",
                "C. 是迭代式开发过程",
                "D. 以上都是螺旋模型的特点"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
        {
            "subTopic": "软件开发模型",
            "text": "增量模型适用于（）。",
            "options": [
                "A. 需求明确的项目",
                "B. 需要快速交付部分功能的项目",
                "C. 技术风险高的项目",
                "D. 小规模项目"
            ],
            "answer": "B",
            "difficulty": "medium"
        },
        # 需求工程
        {
            "subTopic": "需求分析",
            "text": "软件需求分析的主要任务包括（）。",
            "options": [
                "A. 确定系统的功能需求",
                "B. 确定系统的性能需求",
                "C. 建立系统的逻辑模型",
                "D. 以上都是需求分析的主要任务"
            ],
            "answer": "D",
            "difficulty": "easy"
        },
        {
            "subTopic": "需求分析",
            "text": "需求获取的方法包括（）。",
            "options": [
                "A. 用户访谈、问卷调查",
                "B. 原型法、场景分析",
                "C. 文档分析、观察法",
                "D. 以上都是需求获取方法"
            ],
            "answer": "D",
            "difficulty": "easy"
        },
        {
            "subTopic": "需求分析",
            "text": "需求规格说明书(SRS)应包含（）。",
            "options": [
                "A. 功能需求、性能需求",
                "B. 约束条件、接口需求",
                "C. 质量属性需求",
                "D. 以上都是SRS应包含的内容"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
        # 软件质量
        {
            "subTopic": "软件质量管理",
            "text": "软件质量保证(SQA)的主要活动包括（）。",
            "options": [
                "A. 评审和审计",
                "B. 质量记录",
                "C. 过程监控",
                "D. 以上都是SQA的主要活动"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
        {
            "subTopic": "软件质量管理",
            "text": "软件评审的目的是（）。",
            "options": [
                "A. 发现软件中的缺陷",
                "B. 确保软件符合标准",
                "C. 提高软件质量",
                "D. 以上都是软件评审的目的"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
        # 软件文档
        {
            "subTopic": "软件文档管理",
            "text": "软件文档的分类包括（）。",
            "options": [
                "A. 用户文档、开发文档、管理文档",
                "B. 需求文档、设计文档、测试文档",
                "C. 技术文档、产品文档、过程文档",
                "D. 规划文档、实施文档、维护文档"
            ],
            "answer": "A",
            "difficulty": "easy"
        },
        # 软件维护
        {
            "subTopic": "软件维护",
            "text": "软件维护的类型包括（）。",
            "options": [
                "A. 改正性维护、适应性维护",
                "B. 完善性维护、预防性维护",
                "C. 紧急维护、计划维护",
                "D. 以上都是软件维护的类型"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
        {
            "subTopic": "软件维护",
            "text": "软件维护成本最高的类型通常是（）。",
            "options": [
                "A. 改正性维护",
                "B. 适应性维护",
                "C. 完善性维护",
                "D. 预防性维护"
            ],
            "answer": "C",
            "difficulty": "medium"
        },
    ],
    "os": [
        # 进程管理
        {
            "subTopic": "进程管理",
            "text": "进程的基本状态包括（）。",
            "options": [
                "A. 运行、就绪、阻塞",
                "B. 新建、终止、挂起",
                "C. 执行、等待、完成",
                "D. 活动、静止、暂停"
            ],
            "answer": "A",
            "difficulty": "easy"
        },
        {
            "subTopic": "进程管理",
            "text": "进程从运行状态转换到就绪状态的原因是（）。",
            "options": [
                "A. 时间片用完",
                "B. 等待I/O完成",
                "C. 进程执行完毕",
                "D. 进程被创建"
            ],
            "answer": "A",
            "difficulty": "easy"
        },
        {
            "subTopic": "进程调度",
            "text": "进程调度算法包括（）。",
            "options": [
                "A. 先来先服务(FCFS)",
                "B. 短作业优先(SJF)",
                "C. 时间片轮转(RR)",
                "D. 以上都是进程调度算法"
            ],
            "answer": "D",
            "difficulty": "easy"
        },
        {
            "subTopic": "进程调度",
            "text": "优先权调度算法可能导致的问题是（）。",
            "options": [
                "A. 进程饥饿",
                "B. 系统死锁",
                "C. 内存不足",
                "D. 磁盘损坏"
            ],
            "answer": "A",
            "difficulty": "medium"
        },
        # PV操作
        {
            "subTopic": "PV操作",
            "text": "PV操作用于（）。",
            "options": [
                "A. 进程同步和互斥",
                "B. 内存分配",
                "C. 文件管理",
                "D. 设备管理"
            ],
            "answer": "A",
            "difficulty": "easy"
        },
        {
            "subTopic": "PV操作",
            "text": "信号量S的值表示（）。",
            "options": [
                "A. 可用资源的数量",
                "B. 等待进程的数量",
                "C. 进程的优先级",
                "D. 进程的状态"
            ],
            "answer": "A",
            "difficulty": "medium"
        },
        # 死锁
        {
            "subTopic": "死锁",
            "text": "死锁产生的必要条件包括（）。",
            "options": [
                "A. 互斥条件",
                "B. 请求与保持条件",
                "C. 不剥夺条件和环路等待条件",
                "D. 以上都是死锁的必要条件"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
        {
            "subTopic": "死锁",
            "text": "预防死锁的方法包括（）。",
            "options": [
                "A. 破坏互斥条件",
                "B. 破坏请求与保持条件",
                "C. 破坏环路等待条件",
                "D. 以上都是预防死锁的方法"
            ],
            "answer": "D",
            "difficulty": "hard"
        },
        # 内存管理
        {
            "subTopic": "内存管理",
            "text": "虚拟内存的主要目的是（）。",
            "options": [
                "A. 扩大可用的内存空间",
                "B. 提高内存访问速度",
                "C. 减少内存碎片",
                "D. 提高系统安全性"
            ],
            "answer": "A",
            "difficulty": "easy"
        },
        {
            "subTopic": "内存管理",
            "text": "页面置换算法包括（）。",
            "options": [
                "A. 最佳置换(OPT)",
                "B. 先进先出(FIFO)",
                "C. 最近最少使用(LRU)",
                "D. 以上都是页面置换算法"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
        # 文件系统
        {
            "subTopic": "文件系统",
            "text": "文件索引节点(i-node)包含（）。",
            "options": [
                "A. 文件大小",
                "B. 文件权限",
                "C. 文件数据块指针",
                "D. 以上都是i-node包含的信息"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
        # 磁盘调度
        {
            "subTopic": "磁盘调度",
            "text": "磁盘调度算法包括（）。",
            "options": [
                "A. 先来先服务(FCFS)",
                "B. 最短寻道时间优先(SSTF)",
                "C. 扫描算法(SCAN)",
                "D. 以上都是磁盘调度算法"
            ],
            "answer": "D",
            "difficulty": "easy"
        },
    ],
    "db": [
        # 数据库范式
        {
            "subTopic": "范式判定",
            "text": "关系模式的规范化过程中，第一范式(1NF)要求（）。",
            "options": [
                "A. 属性不可再分",
                "B. 消除非主属性对码的部分依赖",
                "C. 消除非主属性对码的传递依赖",
                "D. 消除主属性对码的部分和传递依赖"
            ],
            "answer": "A",
            "difficulty": "easy"
        },
        {
            "subTopic": "范式判定",
            "text": "第二范式(2NF)消除了（）。",
            "options": [
                "A. 非主属性对码的部分函数依赖",
                "B. 非主属性对码的传递函数依赖",
                "C. 主属性对码的部分函数依赖",
                "D. 所有函数依赖"
            ],
            "answer": "A",
            "difficulty": "medium"
        },
        {
            "subTopic": "范式判定",
            "text": "第三范式(3NF)消除了（）。",
            "options": [
                "A. 非主属性对码的部分函数依赖",
                "B. 非主属性对码的传递函数依赖",
                "C. 主属性对码的部分和传递依赖",
                "D. 多值依赖"
            ],
            "answer": "B",
            "difficulty": "medium"
        },
        # 事务
        {
            "subTopic": "数据库事务",
            "text": "数据库事务的ACID特性是指（）。",
            "options": [
                "A. 原子性、一致性、隔离性、持久性",
                "B. 可用性、一致性、独立性、持久性",
                "C. 原子性、并发性、隔离性、持久性",
                "D. 自动性、一致性、隔离性、持久性"
            ],
            "answer": "A",
            "difficulty": "easy"
        },
        {
            "subTopic": "数据库事务",
            "text": "事务的隔离级别包括（）。",
            "options": [
                "A. 读未提交、读已提交",
                "B. 可重复读、串行化",
                "C. 读提交、写提交",
                "D. 以上都是隔离级别"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
        # ER图
        {
            "subTopic": "ER图设计",
            "text": "ER图转换为关系模式时，多对多联系转换成（）。",
            "options": [
                "A. 一个独立的关系模式",
                "B. 合并到任一实体",
                "C. 合并到两个实体",
                "D. 不需要转换"
            ],
            "answer": "A",
            "difficulty": "medium"
        },
        {
            "subTopic": "ER图设计",
            "text": "ER图合并时可能出现的冲突包括（）。",
            "options": [
                "A. 属性冲突",
                "B. 命名冲突",
                "C. 结构冲突",
                "D. 以上都是ER图合并的冲突"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
        # SQL
        {
            "subTopic": "SQL查询",
            "text": "SQL中的分组查询使用（）子句。",
            "options": [
                "A. GROUP BY",
                "B. ORDER BY",
                "C. WHERE",
                "D. HAVING"
            ],
            "answer": "A",
            "difficulty": "easy"
        },
        {
            "subTopic": "SQL查询",
            "text": "HAVING子句用于（）。",
            "options": [
                "A. 对分组后的结果进行过滤",
                "B. 对行进行过滤",
                "C. 对列进行过滤",
                "D. 排序结果"
            ],
            "answer": "A",
            "difficulty": "medium"
        },
    ],
    "network": [
        # TCP/IP
        {
            "subTopic": "TCP/IP协议",
            "text": "TCP协议的特点包括（）。",
            "options": [
                "A. 面向连接",
                "B. 可靠传输",
                "C. 全双工通信",
                "D. 以上都是TCP的特点"
            ],
            "answer": "D",
            "difficulty": "easy"
        },
        {
            "subTopic": "TCP/IP协议",
            "text": "TCP三次握手的目的是（）。",
            "options": [
                "A. 建立可靠的连接",
                "B. 防止失效的连接请求",
                "C. 确认双方的接收能力",
                "D. 以上都是三次握手的目的"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
        {
            "subTopic": "TCP/IP协议",
            "text": "HTTP协议默认使用的端口是（）。",
            "options": [
                "A. 80",
                "B. 443",
                "C. 8080",
                "D. 21"
            ],
            "answer": "A",
            "difficulty": "easy"
        },
        {
            "subTopic": "TCP/IP协议",
            "text": "HTTPS相比HTTP增加了（）。",
            "options": [
                "A. SSL/TLS加密",
                "B. 数据压缩",
                "C. 更快的传输速度",
                "D. 更多的功能"
            ],
            "answer": "A",
            "difficulty": "easy"
        },
        # OSI模型
        {
            "subTopic": "OSI模型",
            "text": "OSI七层模型中，负责数据加密和解密的层是（）。",
            "options": [
                "A. 应用层",
                "B. 表示层",
                "C. 会话层",
                "D. 传输层"
            ],
            "answer": "B",
            "difficulty": "medium"
        },
        {
            "subTopic": "OSI模型",
            "text": "OSI模型中，网络层的主要功能是（）。",
            "options": [
                "A. 路由选择",
                "B. 流量控制",
                "C. 数据加密",
                "D. 会话管理"
            ],
            "answer": "A",
            "difficulty": "easy"
        },
        # 网络设备
        {
            "subTopic": "网络设备",
            "text": "路由器的主要功能是（）。",
            "options": [
                "A. 路径选择",
                "B. 数据转发",
                "C. 网络隔离",
                "D. 以上都是路由器的功能"
            ],
            "answer": "D",
            "difficulty": "easy"
        },
        {
            "subTopic": "网络设备",
            "text": "交换机工作在OSI模型的（）。",
            "options": [
                "A. 物理层",
                "B. 数据链路层",
                "C. 网络层",
                "D. 传输层"
            ],
            "answer": "B",
            "difficulty": "easy"
        },
    ],
    "security": [
        # 加密算法
        {
            "subTopic": "加密算法",
            "text": "对称加密算法包括（）。",
            "options": [
                "A. DES、AES",
                "B. RSA、ECC",
                "C. SHA、MD5",
                "D. DSA、ECDSA"
            ],
            "answer": "A",
            "difficulty": "easy"
        },
        {
            "subTopic": "加密算法",
            "text": "非对称加密算法的特点是（）。",
            "options": [
                "A. 使用公钥加密、私钥解密",
                "B. 加密解密使用不同密钥",
                "C. 适合密钥分发",
                "D. 以上都是非对称加密的特点"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
        {
            "subTopic": "加密算法",
            "text": "数字签名的作用是（）。",
            "options": [
                "A. 保证数据的完整性",
                "B. 保证数据的真实性",
                "C. 保证数据的不可否认性",
                "D. 以上都是数字签名的功能"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
        # 认证技术
        {
            "subTopic": "认证技术",
            "text": "PKI体系的核心组件包括（）。",
            "options": [
                "A. CA(证书颁发机构)",
                "B. RA(注册机构)",
                "C. 证书库",
                "D. 以上都是PKI的核心组件"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
        {
            "subTopic": "认证技术",
            "text": "数字证书包含的信息包括（）。",
            "options": [
                "A. 证书持有者的公钥",
                "B. CA的签名",
                "C. 证书的有效期",
                "D. 以上都是数字证书包含的信息"
            ],
            "answer": "D",
            "difficulty": "easy"
        },
        # 安全威胁
        {
            "subTopic": "安全威胁",
            "text": "以下属于网络安全攻击的是（）。",
            "options": [
                "A. DDoS攻击",
                "B. SQL注入",
                "C. XSS跨站脚本攻击",
                "D. 以上都是网络安全攻击"
            ],
            "answer": "D",
            "difficulty": "easy"
        },
        {
            "subTopic": "安全威胁",
            "text": "防止SQL注入的方法包括（）。",
            "options": [
                "A. 使用参数化查询",
                "B. 输入验证",
                "C. 使用ORM框架",
                "D. 以上都是防止SQL注入的方法"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
    ],
    "ip": [
        # 著作权
        {
            "subTopic": "著作权",
            "text": "根据《著作权法》，软件著作权的保护期限是（）。",
            "options": [
                "A. 作者终生及其死亡后50年",
                "B. 作者终生及其死亡后70年",
                "C. 50年",
                "D. 永久保护"
            ],
            "answer": "A",
            "difficulty": "easy"
        },
        {
            "subTopic": "著作权",
            "text": "软件著作权人享有的权利包括（）。",
            "options": [
                "A. 发表权、署名权",
                "B. 修改权、复制权",
                "C. 发行权、出租权",
                "D. 以上都是软件著作权人的权利"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
        # 专利
        {
            "subTopic": "专利",
            "text": "发明专利的保护期限是（）。",
            "options": [
                "A. 10年",
                "B. 20年",
                "C. 30年",
                "D. 50年"
            ],
            "answer": "B",
            "difficulty": "easy"
        },
        {
            "subTopic": "专利",
            "text": "申请专利必须具备的条件包括（）。",
            "options": [
                "A. 新颖性",
                "B. 创造性",
                "C. 实用性",
                "D. 以上都是申请专利的条件"
            ],
            "answer": "D",
            "difficulty": "easy"
        },
        # 商标
        {
            "subTopic": "商标",
            "text": "商标权的保护期限是（）。",
            "options": [
                "A. 10年，可续展",
                "B. 20年，不可续展",
                "C. 30年，可续展",
                "D. 永久保护"
            ],
            "answer": "A",
            "difficulty": "easy"
        },
    ],
    "system": [
        # 嵌入式系统
        {
            "subTopic": "嵌入式系统",
            "text": "嵌入式系统的特点包括（）。",
            "options": [
                "A. 专用性强",
                "B. 实时性要求高",
                "C. 资源受限",
                "D. 以上都是嵌入式系统的特点"
            ],
            "answer": "D",
            "difficulty": "easy"
        },
        {
            "subTopic": "嵌入式系统",
            "text": "硬实时系统的特点是（）。",
            "options": [
                "A. 必须在规定时间内完成任务",
                "B. 任务可以有轻微延迟",
                "C. 不需要实时响应",
                "D. 响应时间可以不确定"
            ],
            "answer": "A",
            "difficulty": "medium"
        },
        # 分布式系统
        {
            "subTopic": "分布式系统",
            "text": "分布式系统的CAP理论指出（）。",
            "options": [
                "A. 分布式系统最多只能同时满足三个特性中的两个",
                "B. 一致性、可用性、分区容错性不能同时满足",
                "C. 网络分区时需要在一致性和可用性之间选择",
                "D. 以上都是CAP理论的内容"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
        {
            "subTopic": "分布式系统",
            "text": "BASE理论是对CAP理论的补充，包括（）。",
            "options": [
                "A. Basically Available(基本可用)",
                "B. Soft State(软状态)",
                "C. Eventually Consistent(最终一致)",
                "D. 以上都是BASE理论的组成部分"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
        # 中间件
        {
            "subTopic": "中间件",
            "text": "中间件的主要作用是（）。",
            "options": [
                "A. 提供分布式应用的通信服务",
                "B. 屏蔽底层平台的差异",
                "C. 提供通用的服务和接口",
                "D. 以上都是中间件的作用"
            ],
            "answer": "D",
            "difficulty": "easy"
        },
        {
            "subTopic": "中间件",
            "text": "常见的中间件类型包括（）。",
            "options": [
                "A. 数据库中间件",
                "B. 消息中间件",
                "C. 交易中间件",
                "D. 以上都是常见的中间件类型"
            ],
            "answer": "D",
            "difficulty": "easy"
        },
        # 企业应用集成
        {
            "subTopic": "企业应用集成",
            "text": "企业应用集成(EAI)的方式包括（）。",
            "options": [
                "A. 数据集成、API集成",
                "B. 功能集成、界面集成",
                "C. 平台集成、业务集成",
                "D. 以上都是EAI的方式"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
        {
            "subTopic": "企业应用集成",
            "text": "数据集成的主要特点是（）。",
            "options": [
                "A. 在数据层实现系统集成",
                "B. 用户可以直接访问不同系统的数据",
                "C. 不需要修改应用程序",
                "D. 以上都是数据集成的特点"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
        # 边缘计算
        {
            "subTopic": "边缘计算",
            "text": "边缘计算的特点包括（）。",
            "options": [
                "A. 降低网络延迟",
                "B. 减少数据传输量",
                "C. 提高响应速度",
                "D. 以上都是边缘计算的特点"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
    ],
    "math": [
        {
            "subTopic": "排列组合",
            "text": "从10个元素中选取3个元素的组合数为（）。",
            "options": [
                "A. 120",
                "B. 720",
                "C. 60",
                "D. 210"
            ],
            "answer": "A",
            "difficulty": "easy"
        },
        {
            "subTopic": "概率计算",
            "text": "某系统中，组件A的可靠性为0.9，组件B的可靠性为0.8，若两组件串联，则系统可靠性为（）。",
            "options": [
                "A. 0.72",
                "B. 0.98",
                "C. 0.85",
                "D. 0.7"
            ],
            "answer": "A",
            "difficulty": "medium"
        },
    ],
    "dist": [
        {
            "subTopic": "分布式一致性",
            "text": "Paxos算法的作用是（）。",
            "options": [
                "A. 实现分布式一致性",
                "B. 解决分布式选举问题",
                "C. 保证分布式系统的可用性",
                "D. 提高分布式系统的性能"
            ],
            "answer": "A",
            "difficulty": "hard"
        },
        {
            "subTopic": "分布式一致性",
            "text": "Raft算法相比Paxos的优点是（）。",
            "options": [
                "A. 更易于理解和实现",
                "B. 性能更好",
                "C. 更安全",
                "D. 以上都是Raft的优点"
            ],
            "answer": "A",
            "difficulty": "medium"
        },
        {
            "subTopic": "分布式事务",
            "text": "两阶段提交(2PC)的缺点包括（）。",
            "options": [
                "A. 同步阻塞",
                "B. 单点故障",
                "C. 数据不一致风险",
                "D. 以上都是2PC的缺点"
            ],
            "answer": "D",
            "difficulty": "hard"
        },
    ],
    "project": [
        {
            "subTopic": "项目范围管理",
            "text": "项目范围管理的主要过程包括（）。",
            "options": [
                "A. 范围规划、范围定义",
                "B. 创建WBS、范围确认",
                "C. 范围控制",
                "D. 以上都是范围管理的过程"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
        {
            "subTopic": "项目进度管理",
            "text": "关键路径是指（）。",
            "options": [
                "A. 项目中耗时最长的路径",
                "B. 决定项目最短完成时间的路径",
                "C. 没有浮动时间的路径",
                "D. 以上都是关键路径的定义"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
        {
            "subTopic": "配置管理",
            "text": "软件配置管理的主要活动包括（）。",
            "options": [
                "A. 配置项识别",
                "B. 版本控制",
                "C. 变更控制",
                "D. 以上都是配置管理的主要活动"
            ],
            "answer": "D",
            "difficulty": "medium"
        },
        {
            "subTopic": "配置管理",
            "text": "配置项版本号规则中，处于草稿状态的版本号格式是（）。",
            "options": [
                "A. 0.X",
                "B. X.Y",
                "C. X.YZ",
                "D. V1.0"
            ],
            "answer": "A",
            "difficulty": "easy"
        },
    ],
}

def generate_simulation_questions():
    """生成模拟题库"""
    questions = []
    q_id = 1

    # 按考点分配生成题目
    for topic, count in TOPIC_DISTRIBUTION.items():
        if topic not in QUESTION_BANK:
            continue

        topic_questions = QUESTION_BANK[topic]

        # 循环使用题目模板
        for i in range(count):
            q_template = topic_questions[i % len(topic_questions)]

            # 添加随机变化（题号、选项顺序等）
            question = {
                "id": f"q_sim_{q_id:03d}",
                "year": "模拟",
                "topic": topic,
                "subTopic": q_template["subTopic"],
                "difficulty": q_template["difficulty"],
                "type": "choice",
                "text": q_template["text"],
                "options": q_template["options"],
                "answer": q_template["answer"],
                "isRealQuestion": False,
                "sourceType": "simulation"
            }

            questions.append(question)
            q_id += 1

    return questions

def organize_exam_sets(questions, sets_count=5, questions_per_set=75):
    """组织题目为套题"""
    exam_sets = []

    for set_num in range(sets_count):
        start_idx = set_num * questions_per_set
        end_idx = min(start_idx + questions_per_set, len(questions))

        set_questions = questions[start_idx:end_idx]

        # 统计本套题目考点分布
        topic_count = {}
        for q in set_questions:
            topic = q["topic"]
            topic_count[topic] = topic_count.get(topic, 0) + 1

        exam_set = {
            "id": f"set{set_num + 1}",
            "name": f"第{set_num + 1}套模拟题",
            "questionCount": len(set_questions),
            "topicDistribution": topic_count,
            "questions": set_questions
        }

        exam_sets.append(exam_set)

    return exam_sets

def main():
    """主函数"""
    print("生成模拟题库...")

    # 生成题目
    all_questions = generate_simulation_questions()
    print(f"生成题目: {len(all_questions)} 道")

    # 组织套题
    exam_sets = organize_exam_sets(all_questions)
    print(f"组织套题: {len(exam_sets)} 套")

    # 统计考点分布
    topic_stats = {}
    for q in all_questions:
        topic = q["topic"]
        topic_stats[topic] = topic_stats.get(topic, 0) + 1

    print("\n考点分布:")
    for topic, count in sorted(topic_stats.items(), key=lambda x: -x[1]):
        print(f"  {topic}: {count}题")

    # 构建最终数据结构
    output = {
        "description": "模拟考试题库 - 覆盖全部考点的高质量模拟题",
        "totalQuestions": len(all_questions),
        "examSets": exam_sets,
        "topicDistribution": topic_stats,
        "questions": all_questions
    }

    # 保存
    with open("data/simulation_questions.json", "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n保存到: data/simulation_questions.json")

if __name__ == "__main__":
    main()
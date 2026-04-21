class FloatingCircleMenu {
    constructor(options = {}) {
        this.options = {
            smallCircleCount: options.smallCircleCount || 6,
            colors: options.colors || [
                '#FF5252', '#FF4081', '#E040FB',
                '#7C4DFF', '#536DFF', '#448AFF', '#536DFE','#7C4DFF','#E040FB','#FF4081'
            ],
            functions: options.functions || [
                'share', 'search', 'settings',
                'help', 'favoritex', 'message', 'custom','daoru','zhankai','fangxiang'
            ],
            labels: {
                share: '编辑',
                search: '搜索',
                settings: '单多',
                help: '保存',
                message: '下级',
                favoritex: '收藏',
                custom: '同级',
                daoru: '导入',
                zhankai: '更多',
                fangxiang:'方向',

                ...options.labels
            },
            // 定义特殊副球的子菜单
            specialCircles: {
                zhankai: {
                    items: [ '一级', '二级','三级', '四级', '固定'],
                    colors: ['#FF9800', '#FFC107', '#FFEB3B', '#CDDC39','#507ef4'],
                    actions: {

                        '一级': () => this.expandLevel(1),
                        '二级': () => this.expandLevel(2),
                        '三级': () => this.expandLevel(3),
                        '四级': () => this.expandLevel(4),
                        '固定': () => this.guding(),
                        // '全部展开': ()=> this.zhankaiAllNodes(),
                        // '全部收起': () => this.closeAllNodes(),
                    }
                },
                fangxiang: {
                    items: ['向右布局', '向左布局', '向上布局', '向下布局'],
                    colors: ['#009688', '#4CAF50', '#8BC34A', '#CDDC39'],
                    actions: {
                        '向右布局': () => this.changeDirection('right'),
                        '向左布局': () => this.changeDirection('left'),
                        '向上布局': () => this.changeDirection('up'),
                        '向下布局': () => this.changeDirection('down')
                    }
                }
            },
            radius: options.radius || 60,
            childRadius: options.childRadius ||60, // 子菜单的半径
            buttonId: options.buttonId || 'show-circle-btn',
            actions: options.actions || {},
            longPressDuration: 4000,
            tapThreshold: 7
        };

        // 初始化变量
        this.mainCircle = null;
        this.progressCircle = null;
        this.messageBox = null;
        this.smallCircles = [];
        this.childCircles = []; // 存储子菜单圆球
        this.isDragging = false;
        this.menuVisible = false;
        this.childMenuVisible = null; // 跟踪当前可见的子菜单
        this.startX = undefined;
        this.startY = undefined;
        this.offsetX = undefined;
        this.offsetY = undefined;
        this.touchStartTime = 0;
        this.longPressTimer = null;
        this.progressTimer = null;
        this.hoverTimer = null;
        this.isLongPressing = false;
        this.isShiftPressed = false;
        this.touchId = null; // 跟踪特定的触摸ID
        this.isTouchEnded = false; // 明确标记触摸是否已结束
        this.activeParentCircle = null; // 当前激活的特殊副球
        this.isFixed = false;

        this.init();
    }

    init() {
        this.createStyles();
        this.createMainCircle();
        this.createProgressCircle();
        this.createMessageBox();
        this.createSmallCircles();
        this.createChildCircles(); // 创建子菜单圆球
        this.bindShowButton();
        this.bindEvents();
    }

    // 样式定义 - 添加子菜单样式
    createStyles() {
        if (!document.getElementById('floating-menu-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'floating-menu-styles';
            styleSheet.textContent = `
        .floating-menu-main-circle {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #4a90e2, #6d5deb);
            border-radius: 50%;
            position: fixed;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            display: flex;
            justify-content: center;
            align-items: center;
            color: white;
            font-size: 8px;
            font-weight: bold;
            user-select: none;
            touch-action: none;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            display: none; /* 默认不显示 */
            z-index: 9999;
        }
        
        .floating-menu-main-circle:active {
            transform: scale(0.95);
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
        }
        
        .floating-menu-progress-circle {
            position: fixed;
            pointer-events: none; /* 不影响鼠标操作 */
            z-index: 9998;
            display: none;
        }
        
        .floating-menu-small-circle {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            position: fixed;
            display: flex;
            justify-content: center;
            align-items: center;
            color: white;
            font-size: 10px;
            font-weight: bold;
            cursor: pointer;
            opacity: 0;
            transform: scale(0);
            transition: transform 0.3s, opacity 0.3s, background-color 0.2s;
            box-shadow: 0 1px 5px rgba(0, 0, 0, 0.15);
            z-index: 9998;
            touch-action: none;
        }
        
        .floating-menu-small-circle.visible {
            opacity: 1;
            transform: scale(1);
            z-index: 9998;
        }
        
        .floating-menu-small-circle:hover {
            transform: scale(1.1);
        }
        
        .floating-menu-small-circle.special {
            border: 2px solid white;
        }
        
        .floating-menu-child-circle {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            position: fixed;
            display: flex;
            justify-content: center;
            align-items: center;
            color: white;
            font-size: 9px;
            font-weight: bold;
            cursor: pointer;
            opacity: 0;
            transform: scale(0);
            transition: transform 0.3s, opacity 0.3s, background-color 0.2s;
            box-shadow: 0 1px 5px rgba(0, 0, 0, 0.15);
            z-index: 9997;
            touch-action: none;
        }
        
        .floating-menu-child-circle.visible {
            opacity: 1;
            transform: scale(1);
        }
        
        .floating-menu-child-circle:hover {
            transform: scale(1.1);
        }
        
        .floating-menu-message {
            position: fixed;
            top: 20px;
            left: 0;
            right: 0;
            text-align: center;
            padding: 10px;
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            border-radius: 5px;
            display: none;
            margin: 0 auto;
            max-width: 300px;
            z-index: 10000;
        }
      `;
            document.head.appendChild(styleSheet);
        }
    }

    createMainCircle() {
        this.mainCircle = document.createElement('div');
        this.mainCircle.className = 'floating-menu-main-circle';
        document.body.appendChild(this.mainCircle);
    }

    createProgressCircle() {
        // 创建SVG元素
        this.progressCircle = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.progressCircle.setAttribute("class", "floating-menu-progress-circle");
        this.progressCircle.setAttribute("width", "44");  // 比主圆大一些
        this.progressCircle.setAttribute("height", "44");
        this.progressCircle.setAttribute("viewBox", "0 0 44 44");

        // 创建背景圆环
        const bgCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        bgCircle.setAttribute("cx", "22");
        bgCircle.setAttribute("cy", "22");
        bgCircle.setAttribute("r", "20");
        bgCircle.setAttribute("fill", "none");
        bgCircle.setAttribute("stroke", "rgba(255,255,255,0.3)");
        bgCircle.setAttribute("stroke-width", "2");

        // 创建进度圆环
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", "22");
        circle.setAttribute("cy", "22");
        circle.setAttribute("r", "20");
        circle.setAttribute("fill", "none");
        circle.setAttribute("stroke", "#FF5252");
        circle.setAttribute("stroke-width", "3");
        circle.setAttribute("stroke-linecap", "round");

        // SVG圆形周长
        const circumference = 2 * Math.PI * 20;
        circle.setAttribute("stroke-dasharray", circumference);
        circle.setAttribute("stroke-dashoffset", circumference);
        circle.id = "progress-circle-indicator";

        // 添加到SVG
        this.progressCircle.appendChild(bgCircle);
        this.progressCircle.appendChild(circle);
        document.body.appendChild(this.progressCircle);
    }

    createMessageBox() {
        this.messageBox = document.createElement('div');
        this.messageBox.className = 'floating-menu-message';
        document.body.appendChild(this.messageBox);
    }

    createSmallCircles() {
        for (let i = 0; i < this.options.smallCircleCount; i++) {
            const smallCircle = document.createElement('div');
            smallCircle.className = 'floating-menu-small-circle';
            smallCircle.style.backgroundColor = this.options.colors[i];
            smallCircle.textContent = this.options.labels[this.options.functions[i]];
            smallCircle.dataset.index = i;
            smallCircle.dataset.functionKey = this.options.functions[i];

            // 标记特殊副球
            if (this.options.specialCircles[this.options.functions[i]]) {
                smallCircle.classList.add('special');
            }

            document.body.appendChild(smallCircle);
            this.smallCircles.push(smallCircle);

            this.bindSmallCircleEvents(smallCircle, i);
        }
    }

    // 创建子菜单圆球 - 新方法
    createChildCircles() {
        // 为每个特殊副球创建子菜单圆球
        Object.keys(this.options.specialCircles).forEach(specialKey => {
            const specialCircleConfig = this.options.specialCircles[specialKey];

            specialCircleConfig.items.forEach((item, index) => {
                const childCircle = document.createElement('div');
                childCircle.className = 'floating-menu-child-circle';
                childCircle.style.backgroundColor = specialCircleConfig.colors[index] || '#888888';
                childCircle.textContent = item;
                childCircle.dataset.parentKey = specialKey;
                childCircle.dataset.label = item;

                document.body.appendChild(childCircle);
                this.childCircles.push(childCircle);

                // 绑定点击事件
                this.bindChildCircleClick(childCircle, specialKey, item);
            });
        });
    }

    bindSmallCircleEvents(smallCircle, index) {
        // 添加防止重复触发的标记
        let isProcessingEvent = false;
        const functionKey = this.options.functions[index];

        // 点击事件
        smallCircle.addEventListener('click', (e) => {
            // 只处理鼠标点击，不处理触摸触发的点击
            if (e.pointerType === undefined || e.pointerType === 'mouse') {
                e.stopPropagation();

                // 防止重复触发
                if (!isProcessingEvent) {
                    isProcessingEvent = true;

                    // 特殊副球不执行操作，只显示子菜单
                    if (this.options.specialCircles[functionKey]) {
                        this.showChildMenu(smallCircle, functionKey);
                    } else {
                        this.handleSmallCircleClick(index);
                    }

                    // 重置标记
                    setTimeout(() => {
                        isProcessingEvent = false;
                    }, 300);
                }
            }
        });

        // 触摸结束事件
        smallCircle.addEventListener('touchend', (e) => {
            e.stopPropagation();

            // 防止重复触发
            if (!isProcessingEvent) {
                isProcessingEvent = true;

                // 特殊副球不执行操作，只显示子菜单
                if (this.options.specialCircles[functionKey]) {
                    this.showChildMenu(smallCircle, functionKey);
                } else {
                    this.handleSmallCircleClick(index);
                }

                // 阻止后续的点击事件
                e.preventDefault();

                // 重置标记
                setTimeout(() => {
                    isProcessingEvent = false;
                }, 300);
            }
        });

        // 为特殊副球添加鼠标悬停事件
        if (this.options.specialCircles[functionKey]) {
            smallCircle.addEventListener('mouseenter', () => {
                this.showChildMenu(smallCircle, functionKey);
            });
        }
    }

    // 绑定子圆球点击事件 - 新方法
    bindChildCircleClick(childCircle, parentKey, label) {
        childCircle.addEventListener('click', (e) => {
            e.stopPropagation();

            // Get and execute action
            const action = this.options.specialCircles[parentKey]?.actions[label];
            if (action) {
                action();
            } else {
                this.showMessage(`执行了${parentKey}的${label}操作`);
            }

            // Hide child menu and main menu only if not in fixed mode
            // We don't need to check isFixed here since the hide methods already check it
            this.hideChildMenu();
            this.hideMenu();
        });

        // Similar for touchend event
        childCircle.addEventListener('touchend', (e) => {
            e.stopPropagation();
            e.preventDefault();

            const action = this.options.specialCircles[parentKey]?.actions[label];
            if (action) {
                action();
            } else {
                this.showMessage(`执行了${parentKey}的${label}操作`);
            }

            // Hide child menu and main menu
            this.hideChildMenu();
            this.hideMenu();
        });
    }

    // 显示子菜单 - 新方法
    // 修改 showChildMenu 方法
    showChildMenu(parentCircle, functionKey) {
        // 如果已经显示了这个子菜单，则不做任何操作
        if (this.childMenuVisible === functionKey) {
            return;
        }

        // 如果显示了其他子菜单，先隐藏
        if (this.childMenuVisible) {
            this.hideChildMenu();
        }

        // 设置当前活跃的父圆球
        this.activeParentCircle = parentCircle;
        this.childMenuVisible = functionKey;

        // 获取特殊副球的子菜单配置
        const childItems = this.options.specialCircles[functionKey]?.items || [];
        if (childItems.length === 0) return;

        // 获取主球位置
        const mainRect = this.mainCircle.getBoundingClientRect();
        const mainX = mainRect.left + mainRect.width / 2;
        const mainY = mainRect.top + mainRect.height / 2;

        // 找到属于这个父圆球的子圆球
        const relevantChildCircles = this.childCircles.filter(
            circle => circle.dataset.parentKey === functionKey
        );

        // 放置子圆球 - 围绕主球形成第二层圆环
        relevantChildCircles.forEach((circle, index) => {
            // 计算角度位置，围绕主球分布
            // 计算父球相对于主球的角度
            const parentRect = parentCircle.getBoundingClientRect();
            const parentX = parentRect.left + parentRect.width / 2;
            const parentY = parentRect.top + parentRect.height / 2;

            // 计算父球相对于主球的角度
            const dx = parentX - mainX;
            const dy = parentY - mainY;
            const parentAngle = Math.atan2(dy, dx);

            // 子球围绕主球分布，但在父球的方向上展开
            const angleStart = parentAngle - Math.PI/4; // 在父球方向左右各45度范围内展开
            const angle = angleStart + (Math.PI/2 / (childItems.length - 1)) * index; //第三层球间距

            // 计算位置 - 使用更大的半径作为第二层
            const radius = this.options.radius * 1.65; // 第二层半径比第一层大 //第二层离第一层的距离
            const x = mainX + radius * Math.cos(angle) - circle.offsetWidth / 2;
            const y = mainY + radius * Math.sin(angle) - circle.offsetHeight / 2;

            // 设置位置
            circle.style.left = `${x}px`;
            circle.style.top = `${y}px`;

            // 显示子圆球，添加延迟动画效果
            setTimeout(() => {
                circle.classList.add('visible');
            }, index * 50);
        });
    }

    // 隐藏子菜单 - 新方法
    hideChildMenu() {
        // If menu is fixed, don't hide it
        if (this.isFixed) return;

        if (!this.childMenuVisible) return;

        // Find related child circles
        const relevantChildCircles = this.childCircles.filter(
            circle => circle.dataset.parentKey === this.childMenuVisible
        );

        // Hide child circles
        relevantChildCircles.forEach((circle, index) => {
            setTimeout(() => {
                circle.classList.remove('visible');
            }, index * 30);
        });

        // Reset state
        this.childMenuVisible = null;
        this.activeParentCircle = null;
    }

    handleSmallCircleClick(index) {
        const functionKey = this.options.functions[index];

        if (this.options.actions[functionKey]) {
            this.options.actions[functionKey]();
        } else {
            this.defaultActions(functionKey);
        }

        this.hideMenu(); // This will check isFixed internally now
    }

    defaultActions(functionKey) {
        const actionMap = {
            share: () => this.share(),
            search: () => this.search(),
            settings: () => this.settings(),
            help: () => this.help(),
            favoritex: () => this.favoritex(),
            message: () => this.message(),
            custom: () => this.custom(),
            daoru: () => this.daoru(),
            zhankai: () => this.zhankai(),
            fangxiang: () => this.fangxiang(),
        };

        if (actionMap[functionKey]) {
            actionMap[functionKey]();
        } else {
            this.showMessage(`触发了${functionKey}功能`);
            console.log(`${functionKey}功能被触发`);
        }
    }

    // "固定"的子菜单操作实现
    guding() {
        this.isFixed = !this.isFixed;
        if (this.isFixed) {
            this.showMessage("菜单已固定，将一直显示");
        } else {
            this.showMessage("菜单已恢复自动隐藏");
        }
    }


    // "展开"的子菜单操作实现
    zhankaiAllNodes() {
        this.showMessage("执行全部展开操作");
        console.log("执行全部展开操作");
        // 这里实现全部展开的具体逻辑
    }

    closeAllNodes() {
        this.showMessage("执行全部收起操作");
        console.log("执行全部收起操作");
        // 这里实现全部收起的具体逻辑
    }

    expandLevel(level) {
        // 获取所有包含展开级别选项的a标签
        const expandLinks = document.querySelectorAll('.dropdown-menu a[ng-click*="ExpandToLevel"]');

        // 确保level在有效范围内
        if (level < 1 || level > expandLinks.length) {
            console.error('Invalid level specified');
            return;
        }

        // 模拟点击对应的级别链接
        // 注意：数组是0-based，而level是1-based
        const linkToClick = expandLinks[level - 1];

        if (linkToClick) {
            // 创建并触发点击事件
            const event = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
            });
            linkToClick.dispatchEvent(event);
        } else {
            console.error('Could not find the expand link for level', level);
        }
    }

    // "方向"的子菜单操作实现
    changeDirection(direction) {
        this.showMessage(`切换到${direction}方向布局`);
        console.log(`切换到${direction}方向布局`);
        // 这里实现方向切换的具体逻辑
    }

    //编辑
    share() {
        // 找到所有带"节点编辑"文字的.enabled按钮
        const buttons = document.querySelectorAll('.button.enabled .label');

        for (const btn of buttons) {
            if (btn.textContent.trim() === '节点编辑') {
                // 获取父级button元素
                const button = btn.closest('.button');

                // 模拟完整点击事件流
                ['mouseover', 'mousedown', 'mouseup'].forEach(type => {
                    button.dispatchEvent(new MouseEvent(type, {bubbles: true}));
                });
                button.click();

                console.log('已触发"节点编辑"按钮点击');
                return; // 找到后立即退出
            }
        }
    }

    daoru(){
        const buttons = document.querySelectorAll('.button.enabled .label');

        for (const btn of buttons) {
            if (btn.textContent.trim() === '导入节点') {
                // 获取父级button元素
                const button = btn.closest('.button');

                // 模拟完整点击事件流
                ['mouseover', 'mousedown', 'mouseup'].forEach(type => {
                    button.dispatchEvent(new MouseEvent(type, {bubbles: true}));
                });
                button.click();

                console.log('已触发"导入节点"按钮点击');
                return; // 找到后立即退出
            }
        }
    }

    zhankai(){
        // 这个方法现在只用于单击"展开"副球时，而会通过子菜单执行更具体的操作
        this.showMessage('请选择具体的展开操作');
    }

    search() {
        document.querySelector('button.btn.btn-default.search').click();
    }

    settings() {
        document.getElementById('mobileShiftBtn').click();
        // this.showMessage("这是单选/多选切换按钮");
    }

    help() {
        document.querySelector('a.baocun').click();
    }

    fangxiang(){
        // 这个方法现在只用于单击"方向"副球时，而会通过子菜单执行更具体的操作
        this.showMessage('请选择具体的方向操作');
    }

    // 调用favorite方法
    favoritex() {
        if (window.favorite) {
            // 调用favorite时，它会自动获取最新的选择文本
            const result = window.favorite();
            if (!result) {
                this.showMessage("请先选中文本再收藏");
            }
        } else {
            this.showMessage("收藏功能未初始化");
            console.error("favorite方法未定义");
        }
    }

    message() {
        document.querySelector('.km-btn-item.append-child-node').click();
    }

    custom() {
        document.querySelector('.km-btn-item.append-sibling-node').click();
    }

    bindShowButton() {
        const showBtn = document.getElementById(this.options.buttonId);
        if (showBtn) {
            showBtn.addEventListener('click', () => {
                this.show();
            });
        }
    }

    // 绑定事件 - 更新处理逻辑
    bindEvents() {
        // Mouse/touch down events
        this.mainCircle.addEventListener('mousedown', this.handleInteractionStart.bind(this));
        this.mainCircle.addEventListener('touchstart', this.handleInteractionStart.bind(this), { passive: false });

        // Mouse/touch move events
        document.addEventListener('mousemove', this.handleDrag.bind(this));
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });

        // Mouse/touch release events - must be bound at document level to ensure they're not missed
        document.addEventListener('mouseup', this.handleInteractionEnd.bind(this));
        document.addEventListener('touchend', this.handleInteractionEnd.bind(this));
        document.addEventListener('touchcancel', this.handleInteractionEnd.bind(this));

        // Mouse out
        this.mainCircle.addEventListener('mouseleave', this.handleMouseLeave.bind(this));

        // Mouse hover
        this.mainCircle.addEventListener('mouseenter', this.handleHoverStart.bind(this));
        this.mainCircle.addEventListener('mouseleave', this.handleHoverEnd.bind(this));

        // Main circle click event - only for mouse clicks, touch clicks are handled in handleInteractionEnd
        this.mainCircle.addEventListener('click', (e) => {
            // Only process for mouse events, not touch events (which we handle separately)
            if (e.pointerType === undefined || e.pointerType === 'mouse') {
                this.handleClick(e);
            }
        });

        // 当点击到页面其他地方时，隐藏所有菜单
        // Add to bindEvents()
        document.addEventListener('click', (e) => {
            // Skip if in fixed mode
            if (this.isFixed) return;

            // Ensure click is not on menu or its children
            if (!e.target.closest('.floating-menu-main-circle') &&
                !e.target.closest('.floating-menu-small-circle') &&
                !e.target.closest('.floating-menu-child-circle')) {

                // Hide child menu and main menu
                if (this.childMenuVisible) {
                    this.hideChildMenu();
                }
                if (this.menuVisible) {
                    this.hideMenu();
                }
            }
        });

        // Prevent context menu
        this.mainCircle.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Window resize
        window.addEventListener('resize', () => {
            if (this.menuVisible) {
                this.updateSmallCirclesPosition();

                if (this.childMenuVisible) {
                    // 如果子菜单可见，需要重新定位
                    this.hideChildMenu();
                    // 寻找激活的父圆球
                    if (this.activeParentCircle) {
                        const functionKey = this.activeParentCircle.dataset.functionKey;
                        this.showChildMenu(this.activeParentCircle, functionKey);
                    }
                }
            }
            if (this.mainCircle.style.display !== 'none') {
                this.initializeMainCircle();
            }
        });
    }
    // 鼠标离开处理
    handleMouseLeave() {
        // 仅对鼠标事件有效，触摸事件会由touchend处理
        if (!('ontouchstart' in window)) {
            this.clearLongPressTimer();
        }
    }

    // 交互开始处理 - 完全修改的关键部分
    handleInteractionStart(e) {
        e.preventDefault();
        e.stopPropagation();

        // 重置状态
        this.isDragging = false;
        this.isLongPressing = false;
        this.isTouchEnded = false;

        // 记录触摸ID（仅触摸事件）
        if (e.type === 'touchstart') {
            if (e.touches.length > 0) {
                this.touchId = e.touches[0].identifier;
            }
        }

        // 记录开始位置
        const clientX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
        const clientY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;

        this.startX = clientX;
        this.startY = clientY;
        this.touchStartTime = Date.now();

        // 计算偏移量
        const rect = this.mainCircle.getBoundingClientRect();
        this.offsetX = this.startX - rect.left;
        this.offsetY = this.startY - rect.top;

        // 显示菜单（仅触摸事件）
        if (e.type === 'touchstart' && !this.menuVisible) {
            this.showMenu();
        }

        // 开始长按计时
        if (e.type === 'touchstart') {
            // 延迟一点开始长按计时，避免误触
            setTimeout(() => {
                // 检查触摸是否仍然活跃
                if (!this.isTouchEnded) {
                    this.startLongPressTimer();
                }
            }, 200);
        } else {
            // 鼠标事件直接开始长按计时
            this.startLongPressTimer();
        }
    }
    // 开始长按计时器 - 重写
    startLongPressTimer() {
        // 清除旧计时器
        this.clearLongPressTimer();

        // 如果触摸已结束，不启动长按
        if (this.isTouchEnded) {
            return;
        }

        // 设置长按状态
        this.isLongPressing = true;

        // 显示进度圆环
        this.updateProgressCirclePosition();
        this.progressCircle.style.display = 'block';

        // 获取圆环元素和周长
        const circle = document.getElementById('progress-circle-indicator');
        const circumference = 2 * Math.PI * 20;

        // 重置进度
        circle.setAttribute("stroke-dashoffset", circumference);

        // 设置进度动画变量
        const startTime = Date.now();
        const duration = this.options.longPressDuration;

        // 清除可能存在的旧动画
        if (this.progressTimer) {
            cancelAnimationFrame(this.progressTimer);
        }

        // 动画函数
        const animate = () => {
            // 如果长按状态已取消或触摸已结束，停止动画
            if (!this.isLongPressing || this.isTouchEnded) {
                cancelAnimationFrame(this.progressTimer);
                this.progressCircle.style.display = 'none';
                return;
            }

            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // 更新圆环进度
            const dashoffset = circumference * (1 - progress);
            circle.setAttribute("stroke-dashoffset", dashoffset);

            if (progress < 1) {
                // 继续动画
                this.progressTimer = requestAnimationFrame(animate);
            } else {
                // 进度完成，取消动画
                cancelAnimationFrame(this.progressTimer);
            }
        };

        // 开始动画
        this.progressTimer = requestAnimationFrame(animate);

        // 设置长按完成的计时器
        this.longPressTimer = setTimeout(() => {
            // 确保长按状态仍然有效且触摸未结束
            if (this.isLongPressing && !this.isTouchEnded) {
                // 显示确认对话框
                const shouldHide = confirm("确定要关闭悬浮菜单吗？");
                if (shouldHide) {
                    this.hide();
                    this.showMessage("菜单已隐藏");
                }
                // 无论确认与否，都重置长按状态
                this.resetProgressCircle();
            }
        }, this.options.longPressDuration);
    }

    // 更新进度圆环位置
    updateProgressCirclePosition() {
        const rect = this.mainCircle.getBoundingClientRect();
        this.progressCircle.style.left = `${rect.left - 4}px`;
        this.progressCircle.style.top = `${rect.top - 4}px`;
    }

    // 重置进度圆环
    resetProgressCircle() {
        this.isLongPressing = false;

        if (this.progressTimer) {
            cancelAnimationFrame(this.progressTimer);
            this.progressTimer = null;
        }

        this.progressCircle.style.display = 'none';

        const circle = document.getElementById('progress-circle-indicator');
        if (circle) {
            const circumference = 2 * Math.PI * 20;
            circle.setAttribute("stroke-dashoffset", circumference);
        }
    }

    // 清除长按计时器
    clearLongPressTimer() {
        this.isLongPressing = false;

        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }

        this.resetProgressCircle();
    }

    // 处理触摸移动
    handleTouchMove(e) {
        // 检查是否是我们跟踪的触摸
        let touchFound = false;
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === this.touchId) {
                touchFound = true;
                break;
            }
        }

        // 如果找不到对应的触摸，可能是系统接管了触摸，取消长按
        if (!touchFound) {
            this.isTouchEnded = true;
            this.clearLongPressTimer();
            return;
        }

        // 找到对应触摸，处理移动
        if (this.isLongPressing) {
            // 计算移动距离
            let activeTouch = null;
            for (let i = 0; i < e.touches.length; i++) {
                if (e.touches[i].identifier === this.touchId) {
                    activeTouch = e.touches[i];
                    break;
                }
            }

            if (activeTouch) {
                const moveX = Math.abs(activeTouch.clientX - this.startX);
                const moveY = Math.abs(activeTouch.clientY - this.startY);

                // 如果移动超过阈值，取消长按
                if (moveX > this.options.tapThreshold || moveY > this.options.tapThreshold) {
                    this.clearLongPressTimer();
                }
            }
        }

        // 处理拖动
        this.handleDrag(e);
    }

    // 处理拖动
    // Modify the handleDrag method to update child circles position
    // 修改 handleDrag 方法
    handleDrag(e) {
        if (this.startX === undefined || this.startY === undefined) return;

        let clientX, clientY;
        if (e.type === 'mousemove') {
            clientX = e.clientX;
            clientY = e.clientY;

            // 计算移动距离
            const moveX = Math.abs(clientX - this.startX);
            const moveY = Math.abs(clientY - this.startY);

            // 如果移动超过阈值，取消长按并设置拖动状态
            if (this.isLongPressing && (moveX > this.options.tapThreshold || moveY > this.options.tapThreshold)) {
                this.clearLongPressTimer();
                this.isDragging = true;
            }
        } else if (e.type === 'touchmove') {
            e.preventDefault(); // 防止页面滚动

            // 找到对应的触摸
            let activeTouch = null;
            for (let i = 0; i < e.touches.length; i++) {
                if (e.touches[i].identifier === this.touchId) {
                    activeTouch = e.touches[i];
                    break;
                }
            }

            if (!activeTouch) return;

            clientX = activeTouch.clientX;
            clientY = activeTouch.clientY;
        } else {
            return;
        }

        // 计算新位置
        let newLeft = clientX - this.offsetX;
        let newTop = clientY - this.offsetY;

        // 边界检查
        const maxLeft = window.innerWidth - this.mainCircle.offsetWidth;
        const maxTop = window.innerHeight - this.mainCircle.offsetHeight;

        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        newTop = Math.max(0, Math.min(newTop, maxTop));

        this.mainCircle.style.left = `${newLeft}px`;
        this.mainCircle.style.top = `${newTop}px`;

        // 新增：立即强制重绘主球位置
        this.mainCircle.getBoundingClientRect();

        // 更新所有可见元素的位置
        if (this.menuVisible) {
            this.updateSmallCirclesPosition();

            // 新增：使用最新位置立即更新子菜单
            if (this.childMenuVisible && this.activeParentCircle) {
                const mainCenter = {
                    x: parseFloat(this.mainCircle.style.left) + this.mainCircle.offsetWidth/2,
                    y: parseFloat(this.mainCircle.style.top) + this.mainCircle.offsetHeight/2
                };

                // 直接更新子球位置而不重新触发动画
                this.updateChildCirclesPosition(mainCenter);
            }
        }
    }


    updateChildCirclesPosition(mainCenter) {
        const parentCircle = this.activeParentCircle;
        const functionKey = this.childMenuVisible;
        const childItems = this.options.specialCircles[functionKey]?.items || [];

        const parentRect = parentCircle.getBoundingClientRect();
        const parentCenter = {
            x: parentRect.left + parentRect.width/2,
            y: parentRect.top + parentRect.height/2
        };

        // 计算父球相对主球的角度
        const dx = parentCenter.x - mainCenter.x;
        const dy = parentCenter.y - mainCenter.y;
        const parentAngle = Math.atan2(dy, dx);

        // 获取相关子球
        const relevantChildCircles = this.childCircles.filter(
            circle => circle.dataset.parentKey === functionKey
        );

        // 更新每个子球位置
        relevantChildCircles.forEach((circle, index) => {
            const angleStart = parentAngle - Math.PI/4;
            const angle = angleStart + (Math.PI/2 / (childItems.length - 1)) * index; //第三层球间距 /4变小 /2变大
            const radius = this.options.radius * 1.8;

            const x = mainCenter.x + radius * Math.cos(angle) - circle.offsetWidth/2;
            const y = mainCenter.y + radius * Math.sin(angle) - circle.offsetHeight/2;

            circle.style.left = `${x}px`;
            circle.style.top = `${y}px`;
        });
    }
    // 处理交互结束 - 重写
    // Modify the handleInteractionEnd function
    handleInteractionEnd(e) {
        // 检查是否是我们跟踪的触摸
        if (e.type === 'touchend' || e.type === 'touchcancel') {
            let touchFound = false;

            if (e.changedTouches) {
                for (let i = 0; i < e.changedTouches.length; i++) {
                    if (e.changedTouches[i].identifier === this.touchId) {
                        touchFound = true;
                        break;
                    }
                }
            }

            // 如果不是我们跟踪的触摸，忽略
            if (!touchFound && this.touchId !== null) {
                return;
            }

            // 标记触摸已结束
            this.isTouchEnded = true;
        }

        // 清除长按状态
        this.clearLongPressTimer();

        // 检查是否是点击/轻触
        if ((e.type === 'mouseup' || e.type === 'touchend') && this.startX !== undefined) {
            let clientX, clientY;

            if (e.type === 'mouseup') {
                clientX = e.clientX;
                clientY = e.clientY;
            } else if (e.type === 'touchend' && e.changedTouches && e.changedTouches.length > 0) {
                // 找到对应的触摸
                let activeTouch = null;
                for (let i = 0; i < e.changedTouches.length; i++) {
                    if (e.changedTouches[i].identifier === this.touchId) {
                        activeTouch = e.changedTouches[i];
                        break;
                    }
                }

                if (activeTouch) {
                    clientX = activeTouch.clientX;
                    clientY = activeTouch.clientY;
                }
            }

            if (clientX !== undefined && clientY !== undefined) {
                const timeDiff = Date.now() - this.touchStartTime;
                const distance = Math.sqrt(Math.pow(clientX - this.startX, 2) + Math.pow(clientY - this.startY, 2));

                // 如果是短触摸且移动很小，当作点击处理
                if (!this.isDragging && distance < this.options.tapThreshold && timeDiff < 300) {
                    // 重要：处理主圆上的点击，仅对菜单可见时
                    if (this.menuVisible) {
                        this.hideMenu();
                        // 阻止默认行为，防止触发其他点击事件
                        if (e.cancelable) {
                            e.preventDefault();
                        }
                    }
                }
            }
        }

        // 重置状态
        this.startX = undefined;
        this.startY = undefined;
        this.touchId = null;

        // 延迟重置拖动状态，防止点击冲突
        setTimeout(() => {
            this.isDragging = false;
        }, 10);
    }


    // 处理悬停开始
    handleHoverStart() {
        // 只在菜单未显示时触发显示
        if (!this.menuVisible) {
            this.clearHoverTimer();
            this.hoverTimer = setTimeout(() => {
                this.showMenu();
            }, 100);
        }
    }

    // 处理悬停结束
    handleHoverEnd() {
        this.clearHoverTimer();
    }

    // 清除悬停计时器
    clearHoverTimer() {
        if (this.hoverTimer) {
            clearTimeout(this.hoverTimer);
            this.hoverTimer = null;
        }
    }

    // 处理点击
    handleClick(e) {
        e.preventDefault();
        e.stopPropagation();

        // Toggle menu only when not dragging
        if (!this.isDragging && this.menuVisible) {
            this.hideMenu();
        }
    }

    // 更新小圆球位置
    updateSmallCirclesPosition() {
        const centerX = parseFloat(this.mainCircle.style.left) + this.mainCircle.offsetWidth / 2;
        const centerY = parseFloat(this.mainCircle.style.top) + this.mainCircle.offsetHeight / 2;

        this.smallCircles.forEach((circle, index) => {
            const angle = (index / this.options.smallCircleCount) * 2 * Math.PI;
            const x = centerX + this.options.radius * Math.cos(angle) - circle.offsetWidth / 2;
            const y = centerY + this.options.radius * Math.sin(angle) - circle.offsetHeight / 2;

            circle.style.left = `${x}px`;
            circle.style.top = `${y}px`;
        });
    }

    // 显示菜单
    showMenu() {
        if (this.menuVisible) return;

        this.menuVisible = true;
        this.updateSmallCirclesPosition();

        this.smallCircles.forEach((circle, index) => {
            setTimeout(() => {
                circle.classList.add('visible');
            }, index * 50);
        });

        this.mainCircle.textContent = '×';
    }

    // 隐藏菜单
    hideMenu() {
        // If menu is fixed, don't hide it
        if (this.isFixed) return;

        if (!this.menuVisible) return;

        this.menuVisible = false;

        this.smallCircles.forEach((circle, index) => {
            setTimeout(() => {
                circle.classList.remove('visible');
            }, index * 30);
        });

        this.mainCircle.textContent = '';
    }

    // 初始化主圆球位置
    initializeMainCircle() {
        const centerX = window.innerWidth / 2 - this.mainCircle.offsetWidth / 2;
        const centerY = window.innerHeight / 2 - this.mainCircle.offsetHeight / 2;

        this.mainCircle.style.left = `${centerX}px`;
        this.mainCircle.style.top = `${centerY}px`;
    }

    // 显示消息
    showMessage(text) {
        this.messageBox.textContent = text;
        this.messageBox.style.display = 'block';

        setTimeout(() => {
            this.messageBox.style.display = 'none';
        }, 2000);
    }

    // 显示主圆球
    show() {
        this.mainCircle.style.display = 'flex';
        this.initializeMainCircle();
        this.showMessage("悬浮菜单已激活");
    }

    // 隐藏主圆球
    hide() {
        // 如果菜单打开，先关闭
        if (this.menuVisible) {
            this.hideMenu();
        }
        this.mainCircle.style.display = 'none';
    }
}

// 如果作为模块使用
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = FloatingCircleMenu;
}
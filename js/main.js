// 主应用逻辑
class AIToolNavigation {
    constructor() {
        this.currentPage = 1;
        this.toolsPerPage = 8;
        this.currentFilter = 'all';
        this.favorites = new Set();
        this.allTools = [];
        this.filteredTools = [];
        this.hasMore = true;
        
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
            this.loadUserPreferences();
            this.loadData();
        });
    }

    setupEventListeners() {
        // 主题切换
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());
        
        // 搜索功能
        document.getElementById('search-btn').addEventListener('click', () => this.performSearch());
        document.getElementById('global-search').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });
        
        document.getElementById('hero-search-btn').addEventListener('click', () => this.performHeroSearch());
        document.getElementById('hero-search').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performHeroSearch();
        });
        
        // 筛选按钮
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.filterTools(e.target));
        });
        
        // 加载更多
        document.getElementById('load-more-btn').addEventListener('click', () => this.loadMore());
        
        // 提交工具
        document.getElementById('submit-tool-btn').addEventListener('click', () => this.submitTool());
        
        // 导航链接
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => this.handleNavClick(e));
        });
    }

    loadUserPreferences() {
        // 加载主题偏好
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // 加载收藏
        const savedFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        this.favorites = new Set(savedFavorites);
    }

    async loadData() {
        try {
            const response = await fetch('./data/tools.json');
            const data = await response.json();
            this.allTools = data.tools || [];
            this.categories = data.categories || [];
            
            this.filteredTools = [...this.allTools];
            this.initializeUI();
            
        } catch (error) {
            console.error('加载数据失败:', error);
            this.showError('无法加载工具数据，请刷新页面重试');
        }
    }

    initializeUI() {
        this.renderCategories();
        this.renderTools();
        this.renderWeb3Tools();
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // 更新主题按钮图标
        const themeIcon = document.querySelector('#theme-toggle i');
        themeIcon.className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    renderCategories() {
        const grid = document.getElementById('categories-grid');
        if (!grid || !this.categories) return;
        
        grid.innerHTML = this.categories.map(category => `
            <div class="category-card" data-category="${category.name}">
                <i class="${category.icon || 'fas fa-cube'}"></i>
                <h3>${category.name}</h3>
                <p>${category.description}</p>
            </div>
        `).join('');
        
        // 添加分类点击事件
        grid.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                const category = card.getAttribute('data-category');
                this.filterByCategory(category);
            });
        });
    }

    filterByCategory(category) {
        this.currentPage = 1;
        this.hasMore = true;
        
        if (category === 'all') {
            this.filteredTools = [...this.allTools];
        } else {
            this.filteredTools = this.allTools.filter(tool => tool.category === category);
        }
        
        this.renderTools();
        
        // 滚动到工具区域
        document.getElementById('featured').scrollIntoView({ behavior: 'smooth' });
    }

    filterTools(button) {
        // 更新按钮状态
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        this.currentFilter = button.getAttribute('data-filter');
        this.currentPage = 1;
        this.hasMore = true;
        this.applyFilters();
    }

    applyFilters() {
        let filtered = [...this.allTools];
        
        switch (this.currentFilter) {
            case 'free':
                filtered = filtered.filter(tool => tool.isFree);
                break;
            case 'new':
                filtered = filtered.filter(tool => tool.isNew);
                break;
        }
        
        this.filteredTools = filtered;
        this.renderTools();
    }

    renderTools() {
        const container = document.getElementById('tools-container');
        if (!container) return;
        
        // 清空容器
        container.innerHTML = '';
        
        if (this.filteredTools.length === 0) {
            container.innerHTML = this.createNoResults();
            this.hideLoadMore();
            return;
        }
        
        // 计算当前页要显示的工具
        const startIndex = 0;
        const endIndex = Math.min(this.currentPage * this.toolsPerPage, this.filteredTools.length);
        const toolsToShow = this.filteredTools.slice(startIndex, endIndex);
        
        // 渲染工具卡片
        toolsToShow.forEach(tool => {
            const toolCard = this.createToolCard(tool);
            container.appendChild(toolCard);
        });
        
        // 更新加载更多按钮状态
        this.updateLoadMoreButton();
    }

    createToolCard(tool) {
        const card = document.createElement('div');
        card.className = `tool-card ${tool.isWeb3 ? 'web3-tool-card' : ''}`;
        
        // 构建标签徽章
        const badges = [];
        if (tool.isFree) badges.push('<span class="tool-badge">免费</span>');
        if (tool.isNew) badges.push('<span class="tool-badge">新品</span>');
        if (tool.featured) badges.push('<span class="tool-badge">精选</span>');
        
        card.innerHTML = `
            <div class="tool-header">
                <div class="tool-icon">
                    <i class="${tool.icon || 'fas fa-cube'}"></i>
                </div>
                <h3 class="tool-title">${tool.name} ${badges.join('')}</h3>
                <span class="tool-category">${tool.category}</span>
                <p class="tool-description">${tool.description}</p>
            </div>
            <div class="tool-content">
                <div class="tool-tags">
                    ${tool.tags.map(tag => `<span class="tool-tag">${tag}</span>`).join('')}
                </div>
                <div class="tool-actions">
                    <a href="${tool.url}" target="_blank" class="tool-link">
                        访问网站
                    </a>
                    <button class="tool-favorite ${this.favorites.has(tool.id) ? 'active' : ''}" 
                            data-id="${tool.id}">
                        <i class="${this.favorites.has(tool.id) ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                </div>
            </div>
        `;
        
        // 添加收藏功能
        const favoriteBtn = card.querySelector('.tool-favorite');
        favoriteBtn.addEventListener('click', () => this.toggleFavorite(tool.id, favoriteBtn));
        
        return card;
    }

    createNoResults() {
        return `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>没有找到相关工具</h3>
                <p>尝试调整搜索条件或筛选条件</p>
            </div>
        `;
    }

    toggleFavorite(toolId, button) {
        if (this.favorites.has(toolId)) {
            this.favorites.delete(toolId);
            button.classList.remove('active');
            button.innerHTML = '<i class="far fa-heart"></i>';
        } else {
            this.favorites.add(toolId);
            button.classList.add('active');
            button.innerHTML = '<i class="fas fa-heart"></i>';
        }
        
        // 保存到本地存储
        localStorage.setItem('favorites', JSON.stringify([...this.favorites]));
    }

    loadMore() {
        this.currentPage++;
        
        const startIndex = (this.currentPage - 1) * this.toolsPerPage;
        const endIndex = Math.min(this.currentPage * this.toolsPerPage, this.filteredTools.length);
        const toolsToShow = this.filteredTools.slice(startIndex, endIndex);
        
        const container = document.getElementById('tools-container');
        toolsToShow.forEach(tool => {
            const toolCard = this.createToolCard(tool);
            container.appendChild(toolCard);
        });
        
        this.updateLoadMoreButton();
    }

    updateLoadMoreButton() {
        const loadMoreBtn = document.getElementById('load-more-btn');
        const remainingTools = this.filteredTools.length - (this.currentPage * this.toolsPerPage);
        
        this.hasMore = remainingTools > 0;
        
        if (!this.hasMore && this.filteredTools.length > 0) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'block';
        }
    }

    hideLoadMore() {
        const loadMoreBtn = document.getElementById('load-more-btn');
        loadMoreBtn.style.display = 'none';
    }

    performSearch() {
        const query = document.getElementById('global-search').value.trim();
        if (query) {
            this.searchTools(query);
        }
    }

    performHeroSearch() {
        const query = document.getElementById('hero-search').value.trim();
        if (query) {
            this.searchTools(query);
        }
    }

    searchTools(query) {
        const results = this.allTools.filter(tool => 
            tool.name.toLowerCase().includes(query.toLowerCase()) ||
            tool.description.toLowerCase().includes(query.toLowerCase()) ||
            tool.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        );
        
        this.filteredTools = results;
        this.currentPage = 1;
        this.hasMore = true;
        
        this.renderTools();
        
        if (results.length === 0) {
            this.showNotification(`没有找到"${query}"相关的结果`, 'info');
        } else {
            this.showNotification(`找到 ${results.length} 个相关工具`, 'success');
        }
    }

    renderWeb3Tools() {
        const container = document.getElementById('web3-tools');
        if (!container) return;
        
        const web3Tools = this.allTools.filter(tool => tool.isWeb3);
        
        if (web3Tools.length === 0) {
            container.innerHTML = '<div class="no-results"><p>暂无Web3 AI工具</p></div>';
            return;
        }
        
        container.innerHTML = web3Tools.map(tool => this.createToolCard(tool)).join('');
    }

    submitTool() {
        this.showNotification('提交工具功能即将开放，敬请期待！', 'info');
    }

    handleNavClick(event) {
        event.preventDefault();
        const target = event.target.getAttribute('href');
        
        // 更新导航状态
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        event.target.classList.add('active');
        
        // 滚动到对应区域
        if (target && target !== '#') {
            const element = document.querySelector(target);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }

    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => notification.classList.add('show'), 100);
        
        // 自动消失
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }
}

// 初始化应用
const app = new AIToolNavigation();

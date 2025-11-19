// 搜索功能增强
class SearchManager {
    constructor(app) {
        this.app = app;
        this.searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        this.setupSearchEvents();
    }

    setupSearchEvents() {
        // 输入实时搜索
        const searchInputs = ['global-search', 'hero-search'];
        
        searchInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', this.debounce((e) => {
                    this.handleSearchInput(e.target.value);
                }, 300));
            }
        });
    }

    handleSearchInput(query) {
        if (query.length > 2) {
            this.addToSearchHistory(query);
        }
    }

    performSearch(query) {
        
        this.addToSearchHistory(query);
        this.app.searchTools(query);
    }

    addToSearchHistory(query) {
        // 移除重复项
        this.searchHistory = this.searchHistory.filter(term => term !== query);
        
        // 添加到开头
        this.searchHistory.unshift(query);
        
        // 限制历史记录数量
        if (this.searchHistory.length > 10) {
            this.searchHistory = this.searchHistory.slice(0, 10);
        }
        
        // 保存到本地存储
        localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// 初始化搜索管理器
if (window.app) {
    const searchManager = new SearchManager(window.app);
}

/*
Template Name: Adminto - Responsive Bootstrap 5 Admin Dashboard
Author: CoderThemes
Website: https://coderthemes.com/
Contact: support@coderthemes.com
File: Layout
*/


/**
 * LeftSidebar
 * @param {*} $ 
 */
!function ($) {
  'use strict';

  var LeftSidebar = function () {
    this.body = $('body'),
      this.window = $(window)
  };

  /**
   * Reset the theme
   */
  LeftSidebar.prototype._reset = function () {
    this.body.removeAttr('data-sidebar-color');
    this.body.removeAttr('data-sidebar-size');
    this.body.removeAttr('data-sidebar-showuser');
  },

    /**
     * Changes the color of sidebar
     * @param {*} color 
     */
    LeftSidebar.prototype.changeColor = function (color) {
      this.body.attr('data-sidebar-color', color);
      this.parent.updateConfig("sidebar", { "color": color });
    },

    /**
     * Changes the size of sidebar
     * @param {*} size 
     */
    LeftSidebar.prototype.changeSize = function (size) {
      this.body.attr('data-sidebar-size', size);
      this.parent.updateConfig("sidebar", { "size": size });
    },

    /**
     * Toggle User information
     * @param {*} showUser 
     */
    LeftSidebar.prototype.showUser = function (showUser) {
      this.body.attr('data-sidebar-showuser', showUser);
      this.parent.updateConfig("sidebar", { "showuser": showUser });
    },

    /**
     * Initilizes the menu
     */
    LeftSidebar.prototype.initMenu = function () {
      var self = this;

      var layout = $.LayoutThemeApp.getConfig();
      var sidebar = $.extend({}, layout ? layout.sidebar : {});
      var defaultSidebarSize = sidebar.size ? sidebar.size : 'default';

      // resets everything
      this._reset();

      // Left menu collapse
      $(document).on('click', '.button-menu-mobile', function (event) {
        event.preventDefault();
        var sidebarSize = self.body.attr('data-sidebar-size');
        if (self.window.width() >= 993) {
          if (sidebarSize === 'condensed') {
            self.changeSize(defaultSidebarSize);
            window.dispatchEvent(new Event('adminto.setFluid'));
          } else {
            self.changeSize('condensed');
            window.dispatchEvent(new Event('adminto.setBoxed'));
          }
        } else {
          self.changeSize(defaultSidebarSize);
          self.body.toggleClass('sidebar-enable');
          window.dispatchEvent(new Event('adminto.setFluid'));
        }
      });

      // sidebar - main menu
      if ($("#side-menu").length) {
        var navCollapse = $('#side-menu li .collapse');

        // open one menu at a time only
        navCollapse.on({
          'show.bs.collapse': function (event) {
            var parent = $(event.target).parents('.collapse.show');
            $('#side-menu .collapse.show').not(parent).collapse('hide');
          }
        });

        // activate the menu in left side bar (Vertical Menu) based on url
        $("#side-menu a").each(function () {
          var pageUrl = window.location.href.split(/[?#]/)[0];
          if (this.href == pageUrl) {
            $(this).addClass("active");
            $(this).parent().addClass("menuitem-active");
            $(this).parent().parent().parent().addClass("show");
            $(this).parent().parent().parent().parent().addClass("menuitem-active"); // add active to li of the current link

            var firstLevelParent = $(this).parent().parent().parent().parent().parent().parent();
            if (firstLevelParent.attr('id') !== 'sidebar-menu')
              firstLevelParent.addClass("show");

            $(this).parent().parent().parent().parent().parent().parent().parent().addClass("menuitem-active");

            var secondLevelParent = $(this).parent().parent().parent().parent().parent().parent().parent().parent().parent();
            if (secondLevelParent.attr('id') !== 'wrapper')
              secondLevelParent.addClass("show");

            var upperLevelParent = $(this).parent().parent().parent().parent().parent().parent().parent().parent().parent().parent();
            if (!upperLevelParent.is('body'))
              upperLevelParent.addClass("menuitem-active");
          }
        });
      }


      // handling two columns menu if present
      var twoColSideNav = $("#two-col-sidenav-main");
      if (twoColSideNav.length) {
        var twoColSideNavItems = $("#two-col-sidenav-main .nav-link");
        var sideSubMenus = $(".twocolumn-menu-item");

        // showing/displaying tooltip based on screen size
        // if (this.window.width() >= 585) {
        //     twoColSideNavItems.tooltip('enable');
        // } else {
        //     twoColSideNavItems.tooltip('disable');
        // }

        var nav = $('.twocolumn-menu-item .nav-second-level');
        var navCollapse = $('#two-col-menu li .collapse');

        // open one menu at a time only
        navCollapse.on({
          'show.bs.collapse': function () {
            var nearestNav = $(this).closest(nav).closest(nav).find(navCollapse);
            if (nearestNav.length)
              nearestNav.not($(this)).collapse('hide');
            else
              navCollapse.not($(this)).collapse('hide');
          }
        });

        twoColSideNavItems.on('click', function (e) {
          var target = $($(this).attr('href'));

          if (target.length) {
            e.preventDefault();

            twoColSideNavItems.removeClass('active');
            $(this).addClass('active');

            sideSubMenus.removeClass("d-block");
            target.addClass("d-block");

            // showing full sidebar if menu item is clicked
            $.LayoutThemeApp.leftSidebar.changeSize('default');
            return false;
          }
          return true;
        });

        // activate menu with no child
        var pageUrl = window.location.href; //.split(/[?#]/)[0];
        twoColSideNavItems.each(function () {
          if (this.href === pageUrl) {
            $(this).addClass('active');
          }
        });


        // activate the menu in left side bar (Two column) based on url
        $("#two-col-menu a").each(function () {
          if (this.href == pageUrl) {
            $(this).addClass("active");
            $(this).parent().addClass("menuitem-active");
            $(this).parent().parent().parent().addClass("show");
            $(this).parent().parent().parent().parent().addClass("menuitem-active"); // add active to li of the current link

            var firstLevelParent = $(this).parent().parent().parent().parent().parent().parent();
            if (firstLevelParent.attr('id') !== 'sidebar-menu')
              firstLevelParent.addClass("show");

            $(this).parent().parent().parent().parent().parent().parent().parent().addClass("menuitem-active");

            var secondLevelParent = $(this).parent().parent().parent().parent().parent().parent().parent().parent().parent();
            if (secondLevelParent.attr('id') !== 'wrapper')
              secondLevelParent.addClass("show");

            var upperLevelParent = $(this).parent().parent().parent().parent().parent().parent().parent().parent().parent().parent();
            if (!upperLevelParent.is('body'))
              upperLevelParent.addClass("menuitem-active");

            // opening menu
            var matchingItem = null;
            var targetEl = '#' + $(this).parents('.twocolumn-menu-item').attr("id");
            $("#two-col-sidenav-main .nav-link").each(function () {
              if ($(this).attr('href') === targetEl) {
                matchingItem = $(this);
              }
            });
            if (matchingItem) matchingItem.trigger('click');
          }
        });
      }
    },

    /**
     * Initilize the left sidebar size based on screen size
     */
    LeftSidebar.prototype.initLayout = function () {
      // in case of small size, activate the small menu
      if ((this.window.width() >= 768 && this.window.width() <= 1028) || this.body.data('keep-enlarged')) {
        this.changeSize('condensed');
      } else {
        this.changeSize('default');
      }
    },

    /**
     * Initilizes the menu
     */
    LeftSidebar.prototype.init = function () {
      var self = this;
      this.initMenu();
      this.initLayout();

      // on window resize, make menu flipped automatically
      this.window.on('resize', function (e) {
        e.preventDefault();
        self.initLayout();
      });
    },

    $.LeftSidebar = new LeftSidebar, $.LeftSidebar.Constructor = LeftSidebar
}(window.jQuery),


  /**
   * Topbar
   * @param {*} $ 
   */
  function ($) {
    'use strict';

    var Topbar = function () {
      this.body = $('body'),
        this.window = $(window)
    };

    /**
     * Initilizes the menu
     */
    Topbar.prototype.initMenu = function () {
      // Serach Toggle
      $(document).on('click', '#top-search', function (e) {
        $('#search-dropdown').addClass('d-block');
      });

      // hide search on opening other dropdown
      $(document).on('show.bs.dropdown', '.topbar-dropdown', function () {
        $('#search-dropdown').removeClass('d-block');
      });

      //activate the menu in topbar(horizontal menu) based on url
      $(".navbar-nav a").each(function () {
        var pageUrl = window.location.href.split(/[?#]/)[0];
        if (this.href == pageUrl) {
          $(this).addClass("active");
          $(this).parent().addClass("active");
          $(this).parent().parent().addClass("active");

          $(this).parent().parent().parent().addClass("active");
          $(this).parent().parent().parent().parent().addClass("active");
          if ($(this).parent().parent().parent().parent().hasClass('mega-dropdown-menu')) {
            $(this).parent().parent().parent().parent().parent().addClass("active");
            $(this).parent().parent().parent().parent().parent().parent().addClass("active");

          } else {
            var child = $(this).parent().parent()[0].querySelector('.dropdown-item');
            if (child) {
              var pageUrl = window.location.href.split(/[?#]/)[0];
              if (child.href == pageUrl || child.classList.contains('dropdown-toggle'))
                child.classList.add("active");
            }
          }
          var el = $(this).parent().parent().parent().parent().addClass("active").prev();
          if (el.hasClass("nav-link"))
            el.addClass('active');
        }
      });

      // Topbar - main menu
      $(document).on('click', '.navbar-toggle', function (event) {
        $(this).toggleClass('open');
        $('#navigation').slideToggle(400);
      });


      //Horizontal Menu (For SM Screen)
      var AllNavs = document.querySelectorAll('ul.navbar-nav .dropdown .dropdown-toggle');

      var isInner = false;

      AllNavs.forEach(function (element) {
        element.addEventListener('click', function (event) {
          if (!element.parentElement.classList.contains('nav-item')) {
            isInner = true;
            element.parentElement.parentElement.classList.add('show');
            var parent = element.parentElement.parentElement.parentElement.querySelector('.nav-link');
            parent.ariaExpanded = true;
            parent.classList.add("show");
            bootstrap.Dropdown.getInstance(element).show();
          }
        });

        element.addEventListener('hide.bs.dropdown', function (event) {
          if (isInner) {
            event.preventDefault();
            event.stopPropagation();
            isInner = false;
          }
        });
      });

    },

      /**
       * Changes the color of topbar
       * @param {*} color 
       */
      Topbar.prototype.changeColor = function (color) {
        this.body.attr('data-topbar-color', color);
        this.parent.updateConfig("topbar", { "color": color });
      },

      /**
       * Initilizes the menu
       */
      Topbar.prototype.init = function () {
        this.initMenu();
      },
      $.Topbar = new Topbar, $.Topbar.Constructor = Topbar
  }(window.jQuery),


  /**
   * RightBar
   * @param {*} $ 
   */
  function ($) {
    'use strict';

    var RightBar = function () {
      this.body = $('body'),
        this.window = $(window)
    };

    /** 
     * Select the option based on saved config
    */
    RightBar.prototype.selectOptionsFromConfig = function () {
      // var self = this;

      // var config = self.layout.getConfig();

      // if (config) {
      //     $('.right-bar input[type=checkbox]').prop('checked', false);
      //     $('input[type=checkbox][name=color-scheme-mode][value=' + config.mode + ']').prop('checked', true);
      //     $('input[type=checkbox][name=width][value=' + config.width + ']').prop('checked', true);
      //     $('input[type=checkbox][name=menus-position][value=' + config.menuPosition + ']').prop('checked', true);

      //     $('input[type=checkbox][name=leftsidebar-color][value=' + config.sidebar.color + ']').prop('checked', true);
      //     $('input[type=checkbox][name=leftsidebar-size][value=' + config.sidebar.size + ']').prop('checked', true);
      //     $('input[type=checkbox][name=leftsidebar-user]').prop('checked', config.sidebar.showuser);

      //     $('input[type=checkbox][name=topbar-color][value=' + config.topbar.color + ']').prop('checked', true);
      // }
    },

      /**
       * Toggles the right sidebar
       */
      RightBar.prototype.toggleRightSideBar = function () {
        var self = this;
        self.body.toggleClass('right-bar-enabled');
        self.selectOptionsFromConfig();
      },

      /**
       * Initilizes the right side bar
       */
      RightBar.prototype.init = function () {
        var self = this;

        // right side-bar toggle
        $(document).on('click', '.right-bar-toggle', function () {
          self.toggleRightSideBar();
        });

        $(document).on('click', 'body', function (e) {
          // hiding search bar
          if ($(e.target).closest('#top-search').length !== 1) {
            $('#search-dropdown').removeClass('d-block');
          }
          if ($(e.target).closest('.right-bar-toggle, .right-bar').length > 0) {
            return;
          }

          if ($(e.target).closest('.left-side-menu, .side-nav').length > 0 || $(e.target).hasClass('button-menu-mobile')
            || $(e.target).closest('.button-menu-mobile').length > 0) {
            return;
          }

          $('body').removeClass('right-bar-enabled');
          $('body').removeClass('sidebar-enable');
          return;
        });

        // overall color scheme
        $(document).on('change', 'input[type=checkbox][name=color-scheme-mode]', function () {
          const target = $(this)
          const theme = target.prop('checked') ? 'dark' : 'light'

          self.layout.changeMode(theme, true);

          const settings = Local.get('adminto_settings') ?? {}
          settings.theme = theme
          settings.menuColor = theme
          settings.nabvarColor = theme
          Local.set('adminto_settings', settings)

          target.next().text(theme == 'dark' ? 'Modo oscuro' : 'Modo claro')
        });

        // width mode
        $(document).on('change', 'input[type=checkbox][name=width]', function () {
          const target = $(this)
          const width = target.prop('checked') ? 'boxed' : 'fluid'
          self.layout.changeLayoutWidth(width);

          const settings = Local.get('adminto_settings') ?? {}
          settings.width = width
          Local.set('adminto_settings', settings)

          target.next().text(width == 'boxed' ? 'Encuadrado' : 'Completo')
        });

        // menus-position
        $(document).on('change', 'input[type=checkbox][name=menus-position]', function () {
          const target = $(this)
          const menuPosition = target.prop('checked') ? 'scrollable' : 'fixed'
          self.layout.changeMenuPositions(menuPosition);

          const settings = Local.get('adminto_settings') ?? {}
          settings.menuPosition = menuPosition
          Local.set('adminto_settings', settings)

          target.next().text(menuPosition == 'scrollable' ? 'Posicion dinamica' : 'Posicion fija')
        });

        // left sidebar color
        $(document).on('change', 'input[type=radio][name=leftsidebar-color]', function () {
          const target = $('input[type=radio][name=leftsidebar-color]:checked')
          const menuColor = target.val()
          self.layout.leftSidebar.changeColor(menuColor);

          const settings = Local.get('adminto_settings') ?? {}
          settings.menuColor = menuColor
          Local.set('adminto_settings', settings)
        });

        // left sidebar size
        $(document).on('change', 'input[type=radio][name=leftsidebar-size]', function () {
          const target = $('input[type=radio][name=leftsidebar-size]:checked')
          console.log(target)
          const menuSize = target.val()
          console.log(menuSize)
          self.layout.leftSidebar.changeSize(menuSize);

          const settings = Local.get('adminto_settings') ?? {}
          settings.menuSize = menuSize
          Local.set('adminto_settings', settings)
        });

        // left sidebar user information
        $(document).on('change', 'input[type=checkbox][name=leftsidebar-user]', function () {
          const target = $(this)
          const userInfo = target.prop('checked')
          self.layout.leftSidebar.showUser(userInfo);

          const settings = Local.get('adminto_settings') ?? {}
          settings.userInfo = userInfo
          Local.set('adminto_settings', settings)

          target.next().text(userInfo ? 'Mostrar' : 'Ocultar')
        });

        // topbar
        $(document).on('change', 'input[type=checkbox][name=topbar-color]', function () {
          const target = $(this)
          const nabvarColor = target.prop('checked') ? 'dark' : 'light'
          self.layout.topbar.changeColor(nabvarColor);

          const settings = Local.get('adminto_settings') ?? {}
          settings.nabvarColor = nabvarColor
          Local.set('adminto_settings', settings)

          target.next().text(nabvarColor == 'dark' ? 'Oscuro' : 'Acorde al cuerpo')
        });

        // reset
        $(document).on('click', '#resetBtn', function (e) {
          e.preventDefault();
          // reset to default
          // self.layout.reset();
          Local.delete('adminto_settings')
          // self.selectOptionsFromConfig();
          location.reload()
        });
      },

      $.RightBar = new RightBar, $.RightBar.Constructor = RightBar
  }(window.jQuery),


  /**
   * Layout and theme manager
   * @param {*} $ 
   */

  function ($) {
    'use strict';

    // Layout and theme manager

    var LayoutThemeApp = function () {
      this.body = $('body'),
        this.window = $(window),
        this.config = {},
        // styles
        this.defaultBSStyle = $("#bs-default-stylesheet"),
        this.defaultAppStyle = $("#app-default-stylesheet"),
        this.defaultDGStyle = $("#dg-default-stylesheet"),
        this.darkBSStyle = $("#bs-dark-stylesheet"),
        this.darkAppStyle = $("#app-dark-stylesheet"),
        this.darkDGStyle = $("#dg-dark-stylesheet");
    };

    /**
    * Preserves the config in memory
    */
    LayoutThemeApp.prototype._saveConfig = function (newConfig) {
      this.config = $.extend(this.config, newConfig);
      // NOTE: You can make ajax call here to save preference on server side or localstorage as well
    },

      /**
       * Update the config for given config
       * @param {*} param 
       * @param {*} config 
       */
      LayoutThemeApp.prototype.updateConfig = function (param, config) {
        var newObj = {};
        if (typeof config === 'object' && config !== null) {
          var originalParam = this.config[param];
          newObj[param] = $.extend(originalParam, config);
        } else {
          newObj[param] = config;
        }
        this._saveConfig(newObj);
      }

    /**
     * Loads the config - takes from body if available else uses default one
     */
    LayoutThemeApp.prototype.loadConfig = function () {
      var bodyConfig = JSON.parse(this.body.attr('data-layout') ? this.body.attr('data-layout') : '{}');

      var config = $.extend({}, {
        mode: "light",
        width: "fluid",
        menuPosition: 'fixed',
        sidebar: {
          color: "light",
          size: "default",
          showuser: false
        },
        topbar: {
          color: "dark"
        },
        showRightSidebarOnPageLoad: false
      });
      if (bodyConfig) {
        config = $.extend({}, config, bodyConfig);
      };
      return config;
    },

      /**
      * Apply the config
      */
      LayoutThemeApp.prototype.applyConfig = function () {
        // getting the saved config if available
        this.config = this.loadConfig();

        // activate menus
        this.leftSidebar.init();

        this.topbar.init();

        this.leftSidebar.parent = this;

        this.topbar.parent = this;

        const settings = Local.get('adminto_settings') ?? {}
        // mode
        this.changeMode(settings.theme ?? this.config.mode);

        // width
        this.changeLayoutWidth(this.config.width);

        // menu position
        this.changeMenuPositions(this.config.menuPosition);

        // left sidebar
        var sidebarConfig = $.extend({}, this.config.sidebar);
        this.leftSidebar.changeColor(sidebarConfig.color);
        this.leftSidebar.changeSize(sidebarConfig.size);
        this.leftSidebar.showUser(sidebarConfig.showuser);

        // topbar
        var topbarConfig = $.extend({}, this.config.topbar);
        this.topbar.changeColor(topbarConfig.color);
      },

      /**
       * Toggle dark or light mode
       * @param {*} mode 
       */
      LayoutThemeApp.prototype.changeMode = function (mode, fromCheckbox) {
        var self = this;

        // sets the theme
        switch (mode) {
          case "dark": {
            this.body.prepend("")
            this.body.css({ 'visibility': 'hidden', 'opacity': 0 });
            this.defaultBSStyle.prop("disabled", true);
            this.defaultAppStyle.prop("disabled", true);
            this.defaultDGStyle.prop("disabled", true);

            this.darkBSStyle.prop("disabled", false);
            this.darkAppStyle.prop("disabled", false);
            this.darkDGStyle.prop("disabled", false)

            setTimeout(function () {
              self.body.css({ 'visibility': 'visible', 'opacity': 1 });
            }, 500);

            // if(fromCheckbox){
            //     this.leftSidebar.changeColor("dark");
            //     this._saveConfig({ mode: mode, sidebar: $.extend({}, this.config.sidebar, { color: 'dark' }) });
            // }else{
            // }

            this._saveConfig({ mode: mode });


            break;
          }
          default: {
            this.body.css({ 'visibility': 'hidden', 'opacity': 0 });
            this.defaultBSStyle.prop("disabled", false);
            this.defaultAppStyle.prop("disabled", false);
            this.defaultDGStyle.prop("disabled", false);

            this.darkBSStyle.prop("disabled", true);
            this.darkAppStyle.prop("disabled", true);
            this.darkDGStyle.prop("disabled", true);

            setTimeout(function () {
              self.body.css({ 'visibility': 'visible', 'opacity': 1 });
            }, 500);

            // if(fromCheckbox){
            //     this.leftSidebar.changeColor("light");
            //     this._saveConfig({ mode: mode, sidebar: $.extend({}, this.config.sidebar, { color: 'light' }) });
            // }else{

            // }
            this._saveConfig({ mode: mode });
            break;
          }
        }

        this.rightBar.selectOptionsFromConfig();
      }

    /**
     * Changes the width of layout
     */
    LayoutThemeApp.prototype.changeLayoutWidth = function (width) {
      switch (width) {
        case "boxed": {
          this.body.attr('data-layout-width', 'boxed');
          // automatically activating condensed
          $.LeftSidebar.changeSize("condensed");
          window.dispatchEvent(new Event('adminto.setBoxed'));
          this._saveConfig({ width: width });
          break;
        }
        default: {
          this.body.attr('data-layout-width', 'fluid');
          // automatically activating provided size
          var bodyConfig = JSON.parse(this.body.attr('data-layout') ? this.body.attr('data-layout') : '{}');
          $.LeftSidebar.changeSize(bodyConfig && bodyConfig.sidebar ? bodyConfig.sidebar.size : "default");
          this._saveConfig({ width: width });
          window.dispatchEvent(new Event('adminto.setFluid'));

          break;
        }
      }
      this.rightBar.selectOptionsFromConfig();
    }

    /**
     * Changes menu positions
     */
    LayoutThemeApp.prototype.changeMenuPositions = function (position) {
      this.body.attr("data-layout-menu-position", position);
      this._saveConfig({ menuPosition: position });

    }

    /**
     * Clear out the saved config
     */
    LayoutThemeApp.prototype.clearSavedConfig = function () {
      this.config = {};
    },

      /**
       * Gets the config
       */
      LayoutThemeApp.prototype.getConfig = function () {
        return this.config;
      },

      /**
       * Reset to default
       */
      LayoutThemeApp.prototype.reset = function () {
        this.clearSavedConfig();
        this.applyConfig();
      },

      /**
       * Init
       */
      LayoutThemeApp.prototype.init = function () {
        this.leftSidebar = $.LeftSidebar;
        this.topbar = $.Topbar;

        this.leftSidebar.parent = this;
        this.topbar.parent = this;

        // initilize the menu
        this.applyConfig();
      },

      $.LayoutThemeApp = new LayoutThemeApp, $.LayoutThemeApp.Constructor = LayoutThemeApp
  }(window.jQuery);
/*
Template Name: Adminto - Responsive Bootstrap 5 Admin Dashboard
Author: CoderThemes
Website: https://coderthemes.com/
Contact: support@coderthemes.com
File: Main Js File
*/


!function ($) {
  "use strict";

  var Components = function () { };

  //initializing tooltip
  Components.prototype.initTooltipPlugin = function () {
    $.fn.tooltip && $('[data-bs-toggle="tooltip"]').tooltip()
  },

    //initializing popover
    Components.prototype.initPopoverPlugin = function () {
      $.fn.popover && $('[data-bs-toggle="popover"]').popover()
    },

    //initializing toast
    Components.prototype.initToastPlugin = function () {
      $.fn.toast && $('[data-bs-toggle="toast"]').toast()
    },

    //initializing form validation
    Components.prototype.initFormValidation = function () {
      $(".needs-validation").on('submit', function (event) {
        $(this).addClass('was-validated');
        if ($(this)[0].checkValidity() === false) {
          event.preventDefault();
          event.stopPropagation();
          return false;
        }
        return true;
      });
    },

    // Counterup
    Components.prototype.initCounterUp = function () {
      var delay = $(this).attr('data-delay') ? $(this).attr('data-delay') : 100; //default is 100
      var time = $(this).attr('data-time') ? $(this).attr('data-time') : 1200; //default is 1200
      $('[data-plugin="counterup"]').each(function (idx, obj) {
        $(this).counterUp({
          delay: delay,
          time: time
        });
      });
    },

    //peity charts
    Components.prototype.initPeityCharts = function () {
      $('[data-plugin="peity-pie"]').each(function (idx, obj) {
        var colors = $(this).attr('data-colors') ? $(this).attr('data-colors').split(",") : [];
        var width = $(this).attr('data-width') ? $(this).attr('data-width') : 20; //default is 20
        var height = $(this).attr('data-height') ? $(this).attr('data-height') : 20; //default is 20
        $(this).peity("pie", {
          fill: colors,
          width: width,
          height: height
        });
      });
      //donut
      $('[data-plugin="peity-donut"]').each(function (idx, obj) {
        var colors = $(this).attr('data-colors') ? $(this).attr('data-colors').split(",") : [];
        var width = $(this).attr('data-width') ? $(this).attr('data-width') : 20; //default is 20
        var height = $(this).attr('data-height') ? $(this).attr('data-height') : 20; //default is 20
        $(this).peity("donut", {
          fill: colors,
          width: width,
          height: height
        });
      });

      $('[data-plugin="peity-donut-alt"]').each(function (idx, obj) {
        $(this).peity("donut");
      });

      // line
      $('[data-plugin="peity-line"]').each(function (idx, obj) {
        $(this).peity("line", $(this).data());
      });

      // bar
      $('[data-plugin="peity-bar"]').each(function (idx, obj) {
        var colors = $(this).attr('data-colors') ? $(this).attr('data-colors').split(",") : [];
        var width = $(this).attr('data-width') ? $(this).attr('data-width') : 20; //default is 20
        var height = $(this).attr('data-height') ? $(this).attr('data-height') : 20; //default is 20
        $(this).peity("bar", {
          fill: colors,
          width: width,
          height: height
        });
      });
    },

    Components.prototype.initKnob = function () {
      $('[data-plugin="knob"]').each(function (idx, obj) {
        $(this).knob();
      });
    },

    Components.prototype.initTippyTooltips = function () {
      if ($('[data-plugin="tippy"]').length > 0) {
        tippy('[data-plugin="tippy"]');
      }
    },

    Components.prototype.initShowPassword = function () {
      $("[data-password]").on('click', function () {
        if ($(this).attr('data-password') == "false") {
          $(this).siblings("input").attr("type", "text");
          $(this).attr('data-password', 'true');
          $(this).addClass("show-password");
        } else {
          $(this).siblings("input").attr("type", "password");
          $(this).attr('data-password', 'false');
          $(this).removeClass("show-password");
        }
      });
    },

    Components.prototype.initMultiDropdown = function () {
      $('.dropdown-menu a.dropdown-toggle').on('click', function (e) {
        if (!$(this).next().hasClass('show')) {
          $(this).parents('.dropdown-menu').first().find('.show').removeClass("show");
        }
        var $subMenu = $(this).next(".dropdown-menu");
        $subMenu.toggleClass('show');

        return false;
      });
    },

    //initilizing
    Components.prototype.init = function () {
      this.initTooltipPlugin(),
        this.initPopoverPlugin(),
        this.initToastPlugin(),
        this.initFormValidation(),
        this.initCounterUp(),
        this.initPeityCharts(),
        this.initKnob();
      this.initTippyTooltips();
      this.initShowPassword();
      this.initMultiDropdown();
    },

    $.Components = new Components, $.Components.Constructor = Components

}(window.jQuery),

  function ($) {
    "use strict";

    /**
    Portlet Widget
    */
    var Portlet = function () {
      this.$body = $("body"),
        this.$portletIdentifier = ".card",
        this.$portletCloser = '.card a[data-toggle="remove"]',
        this.$portletRefresher = '.card a[data-toggle="reload"]'
    };

    //on init
    Portlet.prototype.init = function () {
      // Panel closest
      var $this = this;
      $(document).on("click", this.$portletCloser, function (ev) {
        ev.preventDefault();
        var $portlet = $(this).closest($this.$portletIdentifier);
        var $portlet_parent = $portlet.parent();
        $portlet.remove();
        if ($portlet_parent.children().length == 0) {
          $portlet_parent.remove();
        }
      });

      // Panel Reload
      $(document).on("click", this.$portletRefresher, function (ev) {
        ev.preventDefault();
        var $portlet = $(this).closest($this.$portletIdentifier);
        // This is just a simulation, nothing is going to be reloaded
        $portlet.append('<div class="card-disabled"><div class="card-portlets-loader"></div></div>');
        var $pd = $portlet.find('.card-disabled');
        setTimeout(function () {
          $pd.fadeOut('fast', function () {
            $pd.remove();
          });
        }, 500 + 300 * (Math.random() * 5));
      });
    },
      //
      $.Portlet = new Portlet, $.Portlet.Constructor = Portlet

  }(window.jQuery),

  function ($) {
    'use strict';

    var App = function () {
      this.$body = $('body'),
        this.$window = $(window)
    };

    /** 
     * Initlizes the controls
    */
    App.prototype.initControls = function () {
      // remove loading
      setTimeout(function () {
        document.body.classList.remove('loading');
      }, 350);

      // Preloader
      $(window).on('load', function () {
        $('#status').fadeOut();
        $('#preloader').delay(350).fadeOut('slow');
      });

      $('[data-toggle="fullscreen"]').on("click", function (e) {
        e.preventDefault();
        $('body').toggleClass('fullscreen-enable');
        if (!document.fullscreenElement && /* alternative standard method */ !document.mozFullScreenElement && !document.webkitFullscreenElement) {  // current working methods
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
          } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
          } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
          }
        } else {
          if (document.cancelFullScreen) {
            document.cancelFullScreen();
          } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
          } else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
          }
        }
      });
      document.addEventListener('fullscreenchange', exitHandler);
      document.addEventListener("webkitfullscreenchange", exitHandler);
      document.addEventListener("mozfullscreenchange", exitHandler);
      function exitHandler() {
        if (!document.webkitIsFullScreen && !document.mozFullScreen && !document.msFullscreenElement) {
          $('body').removeClass('fullscreen-enable');
        }
      }
    },

      //initilizing
      App.prototype.init = function () {
        $.Portlet.init();
        $.Components.init();

        this.initControls();

        // init layout
        this.layout = $.LayoutThemeApp;
        this.rightBar = $.RightBar;
        this.rightBar.layout = this.layout;
        this.layout.rightBar = this.rightBar;

        this.layout.init();
        this.rightBar.init(this.layout);


        // showing the sidebar on load if user is visiting the page first time only
        var bodyConfig = this.$body.data('layout');
        if (window.sessionStorage && bodyConfig && bodyConfig.hasOwnProperty('showRightSidebarOnPageLoad') && bodyConfig['showRightSidebarOnPageLoad']) {
          var alreadyVisited = sessionStorage.getItem("_ADMINTO_VISITED_");
          if (!alreadyVisited) {
            $.RightBar.toggleRightSideBar();
            sessionStorage.setItem("_ADMINTO_VISITED_", true);
          }
        }

        //Popovers
        var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
        var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
          return new bootstrap.Popover(popoverTriggerEl)
        })

        //Tooltips
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
        var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
          return new bootstrap.Tooltip(tooltipTriggerEl)
        })

        //Toasts
        var toastElList = [].slice.call(document.querySelectorAll('.toast'))
        var toastList = toastElList.map(function (toastEl) {
          return new bootstrap.Toast(toastEl)
        })

        // Toasts Placement
        var toastPlacement = document.getElementById("toastPlacement");
        if (toastPlacement) {
          document.getElementById("selectToastPlacement").addEventListener("change", function () {
            if (!toastPlacement.dataset.originalClass) {
              toastPlacement.dataset.originalClass = toastPlacement.className;
            }
            toastPlacement.className = toastPlacement.dataset.originalClass + " " + this.value;
          });
        }
      },

      $.App = new App, $.App.Constructor = App


  }(window.jQuery),
  //initializing main application module
  function ($) {
    "use strict";
    $.App.init();
  }(window.jQuery);

// Waves Effect
Waves.init();

// Feather Icons
feather.replace()
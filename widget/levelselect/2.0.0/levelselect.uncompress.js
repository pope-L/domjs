/*!
 * Created by JetBrains WebStorm.
 * User: yinkehao
 * Date: 12-5-29
 * Time: 下午4:03
 * LevelSelect *
 * 20120702
 *  1.添加对滚动条位置的记忆，在level隐藏后再次显示的时候，滚动条位置与隐藏前相同
 *  2.添加了cacheresult 参数，默认为true。可以缓存本次使用的查询，如果设置为false则每次展开/显示都会进行数据的更新
 * 20120717
 *  1.修正在IE怪异模式下li背景样式导致的跳动问题
 *  2.修正IE6下select 表单控件 在jbox弹出时的的隐藏bug
 */

define(["widget/_base/widget", "widget/jbox", "i18n!nls/system", "base/util"], function (widget, jbox, i18n, util) {
    var levelselect = widget.sub(),
        LevelPanel = widget.sub(),
        SelPanel = widget.sub(),
        Node = widget.sub(),
        Level = widget.sub(),
        PathPanel = widget.sub(),
        InfoPanel = widget.sub();

    PathPanel.fn.extend({
        items: [],
        refresh: function () {

        }
    })
    InfoPanel.fn.extend({
        options: {
            layout: undefined,
            rows: 0
        },
        __initWidget: function () {

            this.__createLine(this.options.layout)

        },
        __createLine: function (layout) {
            if (!this.options.layout) return
            var _tr
            var _cols = [];
            for (var i in layout) {
                if ($.isArray(layout[i])) {
                    this.__createLine(layout[i])
                    //return
                } else if ($.isPlainObject(layout[i])) {
                    if (!_tr)_tr = $("<div style='height: 25px;clear: both;'></div>")
                    var _col = $("<div style='height: 25px;float:left;'></div>");
                    var lable = $("<span style='float:left;font-weight: bold;'></span>").text(layout[i].label + ":")
                    var field = $("<span style='float:left;' data-name='" + layout[i].field + "' >---</span>")
                    _col.append(lable).append(field)
                    // _tr.append(lable)
                    _tr.append(_col)
                    _cols.push(_col)
                }
            }
            for (c in _cols) {
                this.options.rows++
                _cols[c].css({width: (100 / _cols.length) + "%"})
            }
            if (_tr) {
                this.append(_tr);
            }

        },
        refresh: function (item) {

        }
    })
    Node.fn.extend({
        main: function () {
            if (this.data("this"))return  this.data("this")
            this.data("this", this)
            var _self = this;
            this.__init()
        },
        isload: false,
        expendnode: null,
        children: [],
        selectItems: [],
        doms: {
            nodepanel: null,
            hitarea: null,//单击区域
            selarea: null,//选择区域
            label: null,//标签区域
            ico: null,//ico标签
            exp: null, //预留扩展区域
            childpanel: null
        },

        options: {
            idProperty: "label",
            label: "label",//显示的标签
            ico: "",//label的前图标，如果为空不显示，字符串表示一个样式,gif/png/jpg地址字符串表示一个图片地址
            exp: "",//label 后的扩展，为空不显示，字符串表示一个item的key
            index: false,//Node 在list列表内的索引
            type: "normal", //root/normal/first/last
            expandable: true, //是否可以展开
            status: "collapseed",
            parent: null,
            seltype: 0,
            preload: false //预加载//设置为true是，节点下级内容会提前加载。
        },
        __init: function () {
            this.data("this", this)
            this.index = this.options.index > -1 ? this.options.index : 0;
            this.parent = this.options.parent;
            this.item = this.options.item;
            this.type = this.options.type
            this.__initDoms()
        },
        __initDoms: function () {
            this.css({
                "cursor": "pointer"
            })
            var doms = this.doms = {
                nodepanel: $("<div class='nodearea'></div>"),
                hitarea: $("<span class='hitarea'></span>"),//单击区域
                selarea: $("<span class='selarea'></span>"),//选择区域
                label: $("<span class='label'></span>"),//标签区域
                ico: $("<span class='ico'></span>"),//ico标签
                exp: $("<span class='exp'></span>"), //预留扩展区域
                childpanel: $("<ul style='list-style: none;margin: 0px;padding: 0px;'></ul>")
            }
            doms.hitarea.data("this", this)
            doms.label.data("this", this)
            doms.ico.data("this", this)
            doms.selarea.data("this", this)
            doms.exp.data("this", this)
            doms.childpanel.data("this", this)
            if (this.options.multi) {
                //  doms.selbox = SelBox("<div class='selbox'></div> ")
                //   doms.selarea.append(doms.selbox)
                //   doms.selbox.data("this",this)
                //  doms.selarea.show()
            } else {
                doms.selarea.hide()
            }
            var panel = doms.nodepanel
            panel.append(doms.hitarea)
            panel.append(doms.selarea)
            panel.append(doms.ico)
            panel.append(doms.label)
            panel.append(doms.exp)
            this.append(panel)
            var child = $("<div class='childpanel' style='clear: both;' ></div>")
            child.append(this.doms.childpanel)
            this.append(child)
            this.attr("data-key", this.__getItemKey(this.options.item))
            this.refresh()

        },
        __updateSelect: function (node, isSel) {
            if (isSel) {//添加
                if ($.inArray(node.options.item, this.selectItems) == -1) {
                    this.selectItems.push(node.options.item)
                }
            } else {//删除
                this.selectItems = $.grep(this.selectItems, function (item, i) {
                    return item != node.options.item
                })
            }
        },

        __getItemKey: function (item) {
            var key

            if (typeof item == "string") {
                key = item
            } else {
                key = item[this.options.idProperty]
            }

            return util.strToKey(key)
        },
        __getLabelText: function (item) {
            var label
            if (typeof item == "string") {
                label = item
            } else {
                label = item[this.options.label]
            }
            return label
        },
        addChild: function (node) {
            this.children.push(node);
            this.doms.childpanel.append(node)
            return node
        },

        refresh: function (ops) {
            var deferred = new $.Deferred()
            var _self = this
            //处理参数
            var _ordOps = $.extend({}, ops || this.options)
            ops = $.extend(this.options, ops)
            delete this.options._seltype
            //刷新复选框 1,全选，2部分选择，0 不选择
            var _type = this.options.seltype
            if (this.options.expandable === false) {
                _type = this.options.select ? 1 : 0
                deferred.resolve()
            } else {
                if (this.data("result")) {
                    this.data("result").then(function (data) {
                        if (data.length == 0) {
                            _type = _self.options.select ? 1 : 0
                        } else if (_self.selectItems.length == 0) {
                            _type = _self.options.select ? 2 : _ordOps._seltype > 0 ? 2 : 0
                        } else if (data.length == _self.selectItems.length) {
                            var flag = true
                            $.each(_self.children, function (i, node) {
                                if (node.options.seltype != 1) {
                                    flag = false
                                    return flag
                                }
                            })
                            _type = _self.options.select && flag ? 1 : 2
                        } else {
                            _type = 2
                        }
                        deferred.resolve()
                    })
                } else {
                    _type = 0
                    deferred.resolve()
                }
            }
            deferred.then(function () {
                _self.__refreshStyle(_ordOps, _type)
            })

            return deferred
        },
        __refreshStyle: function (ops, _type) {
            var _ordOps = $.extend({}, ops || this.options)
            ops = $.extend(this.options, ops)
            if (this.doms.selbox != null) {
                this.doms.selbox.select(_type)
            }
            var doms = this.doms, item = ops.item, label = item[this.options.label]

            if (typeof _ordOps.expandable != "undefined" || _ordOps.status)
                doms.ico.removeClass("ico_expanded ico_collapseed normal").addClass("ico_" + (ops.expandable ? ops.status : "nurmal"));
            //if(_ordOps.type  )
            switch (ops.type) {
                case "root":
                    this.addClass("root")
                    doms.hitarea.removeClass("hitarea_expanded_root hitarea_collapseed_root")
                    if (ops.expandable)    doms.hitarea.addClass("hitarea_" + ops.status + "_root");
                    break
                case "last":
                    this.addClass("last")
                    doms.hitarea.removeClass("hitarea_expanded_last hitarea_collapseed_last")
                    if (ops.expandable) doms.hitarea.addClass("hitarea_" + ops.status + "_last");
                    break;
                default:
                    doms.hitarea.removeClass("hitarea_expanded hitarea_collapseed")
                    if (ops.expandable)  doms.hitarea.addClass("hitarea_" + ops.status);
            }

            if (ops.select) {
                doms.label.css({
                    "font-weight": "bold"
                })
            } else {
                doms.label.css({
                    "font-weight": ""
                })
            }
            var _self = this;
            if (_ordOps.label)
                if (item[this.options.label] == "") {
                    doms.nodepanel.hide()
                    if (this.options.type == "root") {
                        this.doms.childpanel.removeClass("rootnolabel").addClass("rootnolabel")
                    }
                    return;
                } else {
                    _ordOps.label && doms.label.text(label)
                }

            setTimeout(function () {
                var width
                if (doms.label.width() == 0) {
                    width = "initial"
                } else {
                    width = doms.hitarea.width() + doms.selarea.width() + doms.ico.width() + doms.label.width() + doms.exp.width()
                }
                doms.nodepanel.width(width)
            }, 0)
            if (this.options.refreshParent) {
                // if(_type!=2)
                _self.options.seltype = _type
                if (this.options.parent) this.options.parent.refresh({
                    _seltype: _type,
                    refreshParent: true
                })
            }
        },
        empty: function () {
            this.doms.childpanel.empty();
            this.doms.childpanel.hide()
        },
        expand: function () {
            if (this.options.expandone) {
                var expandnode = this.options.parent.expendnode
                if (expandnode) {
                    expandnode.doms.childpanel.hide()
                    expandnode.refresh({
                        expandable: true,
                        status: "collapseed"
                    })
                }
                this.options.parent.expendnode = this
            }
            this.doms.childpanel.show()
            this.refresh({
                expandable: true,
                status: "expanded"
            })
        },
        collapse: function () {
            if (this.options.expandone) {
                // return
            }
            this.doms.childpanel.hide()
            this.refresh({
                expandable: true,
                status: "collapseed"
            })
        },
        select: function (seltype, ref) {
            //0.取消选择，1.全部选择，2.取消当前节点选择，3选择当前节点
            if (!this.options.multi) {
                return this.options.seltype = 1
            }

            if (typeof seltype == "undefined") {
                var _stype = this.options.seltype
                seltype = _stype == 0 ? 1 : _stype == 1 ? 0 : _stype == 2 ? 3 : _stype == 3 ? 2 : 0
            }

            this.options.seltype = seltype

            this.options.select = seltype == 1 || seltype == 3

            this.options.parent.__updateSelect(this, this.options.select)


            this.refresh({
                refreshParent: ref
            })

            //  return this.options.seltype
        }

    })

    Level.fn.extend({
        options: {},
        doms: {},
        __initWidget: function () {
        }
    })
    LevelPanel.fn.extend({
        options: {

        },
        doms: {},
        __initWidget: function () {
            this.css({
                "overflow": "auto",
                "padding": "2px 5px"
            })
        },
        __initEvent: function () {
            this.on("scroll", function (e) {
                e.stopPropagation()
                e.stopImmediatePropagation()
                return false;
            })
        },
        //加入一个节点
        addNode: function (node) {

        },
        //移除一个节点
        show: function (node) {

        },
        //从界面离开
        leval: function () {

        },
        //计入界面内
        enter: function () {

        }
    })
    levelselect.fn.extend({
        options: {
            id: "levelselect",
            store: null, //数据源
            width: 500,   //选择框宽度
            height: 300,
            title: i18n["Please Select"], //选择框标题
            showpath: true, //是否显示层级地址
            infolayout: null,//选择item，显示的内容信息
            showcols: 3,//显示层级列数
            leveldepth: 0,//要显示的层级深度，为0表示无限制
            selectend: true,//false，选择最后一层，true，选择leveldepth指定的级别
            label: "label", //要显示的标签对于的item的label，默认为label，如果不存在，则显示第一列
            root: "root",//跟节点的key
            rootlabel: i18n["Root"],
            cacheresult: true,
            multi: false, //是否多选择，当为多选择的时候，显示checkbox对话框
            selectcate: false,
            pathfieldlabel: "",
            pathfield: "_item_path",
            autofields: {},
            itemformats: [],
            valuefield: "_item_path",
            valuesplit: ",",
            pathsplit: "/",
            valueitems: null //value对象值列表
        },
        __temp: {
            fristshow: true
        },
        __customEvent: "show",
        __customMember: ["store"],
        doms: {},
        __initWidget: function () {
            if (!this.options.depend) {
                this.options.depend = this.parent()
            }
            this.__initDoms()
            this.__initRoot()
        },
        __initEvent: function () {
            this.__initDialogEvent()
        },
        __initDoms: function () {
            this.__initDialog();
            this.__initLayout();
        },
        __initDialog: function () {
            var boxbuttons = this.__initDialogBt();

            var dialogOptions = {
                buttons: boxbuttons,
                title: this.options.title,
                top: 100,
                width: this.options.width,
                height: this.options.height,
                submit: function () {
                    return false
                }
            }
            var box = this.doms.dialog = jbox("", dialogOptions)
            box.hide()
            this.get("depend").append(box)

        },
        __initDialogBt: function () {
            var _self = this
            var bastBt = {
                "OK": function () {
                    _self.select()
                },
                "Cancel": function () {
                    _self.close()
                }
            }
            if (this.options.multi) {
                bastBt[ "Empty"] = function () {
                    _self.empty()
                }
            }
            this.options.dialogButton = $.extend(bastBt, this.options.dialogButton)
            var buttons = {}
            for (var name in bastBt) {
                if (bastBt[name])
                    buttons[i18n[name] || name] = name
            }
            return buttons;
        },
        __initDialogEvent: function () {
            var _self = this
            this.doms.dialog.find(".jbox-close").off("click")
                .on("click", function () {
                    _self.close()
                })
            var buttons = this.get("dialogButton")
            this.doms.dialog.find(".jbox-button").on("click", function () {
                buttons[$(this).val()]()
            })
            this.on("show", function () {
                _self.__refreshMainPanel()
            })
        },
        __initLayout: function () {
            this.doms.layout = this.doms.dialog.find(".jbox-content")
            this.doms.layout.parent().css({
                "width": "100%"
            })
            this.doms.layout.css({
                "width": "100%",
                height: "100%"
            })
            this.__initPathPanel();
            this.__initMainPanel();
            this.__initInfoPanel();

        },
        __initPathPanel: function () {
            if (this.options.showpath) {
                var pathdom = this.doms.path = $("<div style='padding: 0px;height: 25px;'></div>")
                pathdom.attr("title", i18n["Click the path selection"])
                this.doms.dialog.find(".jbox-content").append(pathdom)
            }
        },
        __initInfoPanel: function () {
            if (this.options.infolayout) {
                var info = this.doms.info = InfoPanel("<div style='padding: 0px;'></div>", {
                    layout: this.options.infolayout
                })
                this.doms.layout.append(info)
            }
        },
        __initMainPanel: function () {
            var main = this.doms.main = $("<div style='clear: both;' ></div>")
            this.doms.layout.append(main)
            this.__computerLayoutCoumns();
            this.__initLevelsPanel();
            this.__initSelPanel();
            var _self = this;
        },
        __refreshMainPanel: function () {
            var _h = this.doms.layout.innerHeight()
            if (this.doms.path) {
                _h -= this.doms.path.outerHeight()
            }
            if (this.doms.info) {
                _h -= this.doms.info.outerHeight()
            }
            _h -= 2
            this.doms.main.width("100%")
            this.doms.main.height(_h)

            var _w = this.__getColumnWidth();

            for (var i in this.doms.level) {
                this.doms.level[i].width(_w)
                this.doms.level[i].height(_h)
            }
            if (this.options.multi) {
                this.doms.sel.width(_w)
                this.doms.sel.height(_h)
            }
        },
        __getColumnWidth: function () {
            if (this.__temp.columnwidth) {
                return this.__temp.columnwidth
            } else {
                return  this.__temp.columnwidth = (this.doms.main.innerWidth() / this.get("colcount") - 2)
            }
        },
        __computerLayoutCoumns: function () {
            //计算列数
            if (this.options.leveldepth > 0 && this.options.leveldepth < this.options.showcols) {
                this.options.showcols = this.options.leveldepth
            }
            //多值
            if (this.options.multi) {
                if (this.options.leveldepth == 1) {
                    //多选是，需要添加一个选择列，所以如果显示层级深度为1的时候，需要设计为两列，以方便进行选中列表的展示
                    this.set("colcount", 2)
                    this.options.showcols = 1
                } else if (this.options.showcols < 3) {
                    //如果层级深度未设置，列宽度小于3，则将列数设置为3，其中一列是选择中列，两列选择框列
                    this.set("colcount", 3)
                    this.options.showcols = 2
                } else {
                    //其他情况下，选择框列比实际列数少一列，方便选中列显示
                    this.set("colcount", this.options.showcols)
                    this.options.showcols--
                }
            } else {
                this.set("colcount", this.options.showcols)
            }
        },
        __initLevelsPanel: function () {
            var level = this.doms.levelpanel = $("<div style='float: left;clear: both;'></div>")
            this.doms.main.append(level)
            this.__initLevelPanel()
        },
        __initLevelPanel: function () {
            this.doms.level = []
            for (var i = 0; i < this.options.showcols; i++) {
                var level = this.doms.level[i] = LevelPanel("<div style='float: left;border: 1px solid #CFCFCF;'></div>")
                this.doms.levelpanel.append(level)
            }
        },
        __initSelPanel: function () {
            if (this.options.multi) {
                var sel = this.doms.sel = SelPanel("<div style='float: right;border: 1px solid #CFCFCF;'></div>")
                this.doms.main.append(sel)
            }
        },
        RootNode: null,
        __initRoot: function () {
            var LevelPanel = this.doms.level[0]
            var rootItem = {};
            rootItem[this.store.idProperty] = this.options.root
            var RootNode
            rootItem[this.options.label] = this.options.rootlabel
            rootItem[this.options.store.idProperty] = this.options.root
            RootNode = this.__createdNode({
                index: 0,
                type: "root",
                item: rootItem,
                status: "expanded",
                expandable: "true",
                idProperty: this.options.store.idProperty,
                level: 0
            })
            //LevelPanel.append(RootNode.doms.nodepanel)
            this.RootNode = RootNode
            if (this.options.autoexpand)
                this.expand(RootLevel)
        },

        __createdNode: function (ops) {
            ops.label = this.options.label
            var node = Node("<li></li>", ops)
            if (this.options.preload) {
                this.loadclidresult(node)
                node.data("result").pipe(function (data) {
                    if (data.length == 0) {
                        node.refresh({
                            expandable: false
                        })
                    }
                })
            }

            return node
        },
        __initChildrenList: function (result, parentnode) {
            var _self = this;

            return  result.pipe(function (data) {

                parentnode.isload = true
                if (data.length == 0) {
                    parentnode.refresh({
                        expandable: false
                    })
                    return data
                }
                parentnode.empty()
                var level = parentnode.options.level
                var levelPanel = _self.doms.level[level]
                if (!levelPanel) {
                    levelPanel = _self.doms.level[level] = LevelPanel("<div style='float: left;border: 1px solid #CFCFCF;'></div>")
                }
                $.each(data, function (i, item) {
                    var type = i == data.length - 1 ? "last" : i == 0 ? "first" : "normal"
                    var expandable = item[_self.store.options.childrenproperty || _self.store.idProperty] != ""
                    var ops = _self.__getNodeOptions({
                        index: i,
                        type: type,
                        item: item,
                        expandable: expandable,
                        parent: parentnode,
                        level: parentnode.options.level + 1
                    })

                    var node = parentnode.addChild(_self.__createdNode(ops))

                    _self.trigger("nodeloaded", [_self, node])
                })

                levelPanel.append(parentnode.doms.childpanel)
                return data;
            })
        },
        __getNodeOptions: function (ops) {
            var expandable = ops.item[this.store.options.childrenproperty || this.store.idProperty] != "",
                parent = ops.parent || undefined,
                index = typeof index == "number" ? ops.index : parent ? parent.children.length : 0,
                type = ops.type ? ops.type : parent ? index < parent.children.length ? "normal" : "last" : "last";
            var item = ops.item
            return {
                index: index,
                type: type,
                item: item,
                expandable: expandable,
                parent: parent,
                expandone: this.options.expandone,
                idProperty: this.options.store.idProperty,
                tree: this,
                multi: this.options.multi,
                select: false
            }
        },
        __computerFieldPath: function (parentitem, item) {
            var _computer = function (pathfield, field) {
                if (!item[pathfield]) {
                    var pathfieldPath
                    if (field) {
                        pathfieldPath = parentitem[pathfield] ? parentitem[pathfield].concat(parentitem[field]) : [parentitem[field]]
                    } else {
                        pathfieldPath = parentitem[pathfield] ? parentitem[pathfield].concat(parentitem) : [parentitem]
                    }
                    item[pathfield] = pathfieldPath
                }
            }
            _computer(this.options.pathfield)
        },
        loadclidresult: function (node) {
            /*加载节点数据，并进行预处理*/
            var _self = this;

            if (!node.data("result") || !node.isload) {
                var result = this.store.getChildren(node.options.item).map(function (item, i) {
                    _self.__computerFieldPath(node.options.item, item)
                    if (_self.options.itemformats) {
                        if ($.isArray(_self.options.itemformats)) {
                            for (var i in _self.options.itemformats) {
                                if (item[i])
                                    item[i] = _self.options.itemformats[i](item[i], item)
                            }
                        } else {
                            alert("可以通过map方法对item内容继续修改，map返回null时，item将被过滤，也可通过filter方法对内容进行过滤")
                        }
                    }

                    if (_self.filter(item)) {
                        return _self.map(item)
                    } else {
                        return null
                    }

                })
                node.data("result", result)
            }
            return node.data("result")
        },

        expand: function (node) {
            if (!node.isload) {
                var result = this.loadclidresult(node);

                this.__initChildrenList(result, node).then(function () {
                    node.expand()
                })
            } else {
                node.expend()
            }
        },
        store: null,
        panel: {
            path: null,
            lists: null,
            info: null,
            select: null
        },
        firstLevel: 0,
        lastLevel: 0,
        focusLevel: 0,//当前光标所在的层级
        focusItemQueue: [],//当前选中的记录队主要用来处理样式现实以及路径
        selectQueue: [],//选中的队列，用于处理用列，户要选择的数据
        levelQueue: [],//层级队列（层级队列内存放列队列），层级队列显示元素数量为 showcols的长度，层级队列的长度与leveldepth相同
        columnQueue: {},//记录所有列的内容，一个列的现实因此都从其中取出
        resultQueue: {},//列结果集，key:object 格式的键值结构，key为item的idProperty
        dialog: null,
        _columns: 3,//列数
        _columnwidth: 0, //列宽度
        _textwidth: 0,
        _locked: false,
        _currentResult: null,
        showDialog: function () {
            this.doms.dialog.show()
            if (this.__temp.fristshow) {
                this.expand(this.RootNode)
                this.__temp.fristshow = false
            }
            this.trigger("show")
            return false
            if (this.dialog) {
                var result = this._initResult()
                this._expendResult(result, 0, this.options.root)
                this.dialog.show();
                if (util.isIE6)
                    $('select').css('visibility', 'hidden')
                return this.dialog;
            }
            var _self = this;
            var _opts = this.options
            //初始化顶层数据

            var buttons = {}
            buttons[i18n["OK"]] = "ok"
            buttons[i18n["Cancel"]] = "cancel"
            //多选时显示情况按钮
            if (this.options.multi) buttons[i18n["Empty"]] = "empty"

            jbox("", {
                buttons: buttons,
                id: _opts.id,
                top: 50,
                width: _opts.width,
                title: _opts.title,
                loaded: function (h) {
                    _self._initPanel(h)
                    _self._initEvent()
                    _self._initSelected()
                    var result = _self._initResult()
                    _self._expendResult(result, 0, _self.options.root)
                    _self.dialog = $("#" + _opts.id)
                },
                submit: function (v, h, f) {
                    if (v == "ok") {
                        _self._selected()
                    } else if (v == "empty") {
                        _self._empty()
                    } else {
                        _self.close()
                    }

                    return false;

                },
                showClose: false
            })
            if (util.isIE6)
                $('select').css('visibility', 'hidden')
        },
        _initResult: function () {
            var result, _self = this;

            if ($.isArray(this.options.roots)) {
                result = this._initResultMultiRoot();
            } else {
                result = this._initResultSigleRoot();
            }
            this.resultQueue[this.options.root] = result
            result.done(function (data) {
                if (typeof _self.options.onload == "function")
                    _self.options.onload(result)
            })
            return result
        },
        //显示单个主分类
        _initResultSigleRoot: function () {
            var rootItem = {}
            rootItem[this.store.idProperty] = this.options.root
            var itemDom = $("<li></li>")
            itemDom.data("item", rootItem)
            var result = this._getResult(itemDom)
            //  var result=this.store.getChildren(rootItem)
            //初始化队列
            return result;
        },
        //地址树组合分类展示
        _initResultMultiRoot: function () {
            var deferred = new $.Deferred()
            var result = this.options.roots
            require(["store/util/QueryResults"], function (QueryResults) {
                result.total = 2
                deferred.resolve(QueryResults(result))
            })
            return deferred
        },
        //初始化列表
        _initPanel: function (dialog) {

            //初始化要显示的列和层级信息
            dialog.css({
                "overflow-y": "hidden"
            })
            if (this.options.leveldepth > 0 && this.options.leveldepth < this.options.showcols) {
                this.options.showcols = this.options.leveldepth
            }
            if (this.options.multi) {
                if (this.options.leveldepth == 1) {
                    //多选是，需要添加一个选择列，所以如果显示层级深度为1的时候，需要设计为两列，以方便进行选中列表的展示
                    this._columns = 2
                    this.options.showcols = 1
                } else if (this.options.showcols < 3) {
                    //如果层级深度未设置，列宽度小于3，则将列数设置为3，其中一列是选择中列，两列选择框列
                    this._columns = 3
                    this.options.showcols = 2
                } else {
                    //其他情况下，选择框列比实际列数少一列，方便选中列显示
                    this._columns = this.options.showcols
                    this.options.showcols--
                }

            } else {
                this._columns = this.options.showcols
            }

            var listheight = this.options.height - 15
            var _opts = this.options

            //初始化路径面板不
            if (_opts.showpath) {
                this.panel.path = $("<div style='padding: 3px 5px 0px;height: 25px'></div>")
                this.panel.path.attr("title", i18n["Click the path selection"])
                dialog.append(this.panel.path)
                listheight -= this.panel.path.height()
            }
            //初始化主面板
            var _contentPanel = $("<div></div>")
            dialog.append(_contentPanel)
            //初始化信息显示面板
            if (_opts.infolayout) {
                this.panel.info = $("<div style='margin: 5px'></div>")
                _infoPanel = this.panel.info
                dialog.append(this.panel.info)

                if (_opts.infolayout) {
                    var layout = _opts.infolayout
                    var _createLine = function (layout) {

                        var _tr = $("<div style='height: 25px;clear: both;'></div>")
                        var _len = layout.length
                        var _w = (_opts.width - 10) / (_len)

                        for (var i in layout) {
                            if ($.isArray(layout[i])) {
                                _createLine(layout[i])
                            }
                            if ($.isPlainObject(layout[i])) {
                                var _col = $("<div style='height: 25px;float:left;' ></div>").width(_w)
                                var lable = $("<span style='float:left;font-weight: bold;'></span>").text(layout[i].label + ":")
                                var field = $("<span style='float:left;' data-type='_iteminfo_' >---</span>")
                                // lable.width(_w)
                                // field.width(_w-lable.width()-10)
                                field.data("layout", layout[i])
                                _col.append(lable).append(field)
                                // _tr.append(lable)
                                _tr.append(_col)
                            }
                        }
                        if (_tr.find("*").length > 0)
                            _infoPanel.append(_tr)
                    }

                    _createLine(layout)
                }

                listheight -= _infoPanel.height()
            }

            _contentPanel.height(listheight)
            _contentPanelList = $("<div style='float: left;margin-left: 3px'></div>")

            this.panel.lists = $("<ul style='list-style: none;margin: 0px;padding:0px 0px 0px; overflow: hidden;'></ul>")
            this.panel.lists.height(listheight)
            _contentPanel.height(listheight)
            _contentPanel.width(this.options.width)
            var panelListwidth = this.options.width * (this.options.showcols / this._columns) - 10
            this.panel.lists.width(panelListwidth)
            this._columnwidth = panelListwidth / this.options.showcols - 2
            this._textwidth = this._columnwidth - 40

            _contentPanelList.width(panelListwidth)
            _contentPanelList.append(this.panel.lists)
            _contentPanel.append(_contentPanelList)
            //初始化选择列表列面板
            for (var i = 0; i < this.options.showcols; i++) {
                this._getLevelDom(i)
            }
            //初始化多选面板
            if (this.options.multi) {
                this._textwidth -= 20

                var _contentPanelSelect = $("<div style='float: right; border: 1px solid #66ccff ;overflow: auto;margin: 0px;padding:0px;margin-right: 3px'></div>")
                this.panel.select = $("<ul style='list-style: none;margin: 0px;padding:0px 0px 0px;'></ul>")
                _contentPanelSelect.append(this.panel.select)
                _contentPanelSelect.width(this.options.width * (1 / this._columns) - 10)
                _contentPanel.append(_contentPanelSelect)
                // console.log(this.options.width,this._columns)
                // _contentPanelSelect.width((this.options.width-18)/this._columns-5)
                _contentPanelSelect.height(listheight - 10)
            }


        },
        //初始化事件
        _initEvent: function () {
            var _self = this
            if (typeof this.options.onselect == "function")
                this.onselect = this.options.onselect
            //事件委托
            var list = this.panel.lists
            var li = "li[class=levellistitem]"
            //单选选中Item 事件
            var _click = function (_this, currlevel, isSelect) {
                //  if(_self.locked) return
                //  _self.locked = true
                // _self._currentResult.then(function(){
                if (_self.focusItemQueue[currlevel]) {
                    _self.focusItemQueue[currlevel].data("focus", false)
                    _self._refreshItemCss(_self.focusItemQueue[currlevel])
                }
                _self.focusItemQueue[currlevel] = $(_this)
                _self.focusItemQueue[currlevel].data("focus", true)
                _self.focusLevel = currlevel

                var nextlevel = currlevel - 0 + 1
                //显示选中的节点信息
                if (!isSelect) {
                    _self._showItemInfo($(_this).data("item"))
                }
                _self._getResult($(_this)).then(function (data) {
                    //如果leveldepth>0 则判断当前level 是否小于leveldepth,份额在为true
                    //var expendable = true
                    var expendable = _self.options.leveldepth > 0 ? currlevel < _self.options.leveldepth - 1 : data.length > 0

                    //如果当前运行选择分类，则selectable始终为true，负责检查当前是否是最后节点即是否可以展开，如果不可以展开则为true，然后在检查当前内容长度
                    var selectable;
                    if (_self.options.selectend) {
                        selectable = (_self.options.selectcate || !expendable || data.length == 0)
                    }
                    else {
                        selectable = _self.options.leveldepth == currlevel + 1
                    }

                    //不能选择时，禁用选择按钮
                    // if(!selectable){
                    //  $(_this).find("input[name=levellistitemcheckbox]").attr("disabled",true)
                    //  }
                    //选择，且能选择
                    if (selectable && isSelect) {
                        _self._onselect($(_this))
                    }
                    // console.log(expendable,isSelect,selectable)
                    //可展开，且不选择或者不能选择时
                    // if(expendable && (!isSelect||!selectable)){
                    if (expendable && (!isSelect)) {
                        _self._expendItemDom($(_this), nextlevel)
                    }
                    //单选时，单击也为选中状态
                    if (!_self.options.multi) {
                        _self.selectQueue = [$(_this).data("item")]
                    }
                    if (data.length > 0 && expendable) {
                        $(_this).data("iscategory", true)
                        var itemextDom = $(_this).find("span.levellistitemext")
                        // itemextDom.text(">")
                        ///**
                        if (itemextDom.html() == "") {
                            if (_self.options.multi) {
                                var checkbox = $("<input   style='width: 16px;height: 16px;line-height: 25px;' type='checkbox' title='" + i18n["Select All"] + "' name='levellistselectallcheckbox' style='margin-top: 3px'/>  ")
                                checkbox.attr("data-columnkey", $(_this).data("item")[_self.store.idProperty])
                                checkbox.data("itemdom", $(_this))
                                itemextDom.append(checkbox)
                                itemextDom.append(">")
                            } else {
                                itemextDom.text(">")
                            }
                        }
                    } else {
                        $(_this).data("iscategory", false)
                    }
                })
                //     _self.locked=false
                //    })
            }
            list.on("click", li, function () {
                var _this = this
                var currlevel = $(_this).data("levelkey")
                _click(_this, currlevel, false)

                _self._refreshItemCss($(_this))
            })
            list.on("selectstart", li, function (e) {
                e.stopPropagation();
                return false
            })
            list.on("dblclick", li, function (e) {
                var _this = this
                var currlevel = $(_this).data("levelkey")
                _click(_this, currlevel, true)
                e.stopPropagation();
                return

            })

            /**
             list.on("click","li input[name=levellistitemcheckbox]",function(e){
             this.checked = false
             $(this).parent().dblclick()
             e.stopPropagation();
             })
             **/
                //鼠标经过事件
            list.on("mouseenter", li, function () {
                if ($.support.boxModel)
                    $(this).css({
                        "background-color": "#ccffff"
                    })
            })
            list.on("mouseleave", li, function () {
                _self._refreshItemCss($(this))
            })
            //多选选择时间
            if (this.panel.select) {
                var _clickSelect = function (itemDom, selectDom) {
                    if (!itemDom) {
                        var _item = selectDom.data("item")
                        _self.options.valueitems = $.grep(_self.options.valueitems, function (item, i) {
                            return (item != _item)
                        })
                        selectDom.remove();
                    } else {
                        _self._onselect(itemDom)
                    }

                }
                this.panel.select.on("click", "li[class=levellistitem] input[name=levellistitemcheckbox]", function () {
                    // _self._onselect
                    _clickSelect($(this).data("itemdom"), $(this).data("selectdom"))
                })
                this.panel.select.on("dblclick", "li[class=levellistitem]", function () {
                    // $(this).data("itemdom")
                    _clickSelect($(this).find("input[name=levellistitemcheckbox]").data("itemdom"), $(this))
                })
                //全选
                list.on("click", "li span>input[name=levellistselectallcheckbox]", function (e) {
                    var itemDom = $(this).data("itemdom")
                    var isChecked = this.checked
                    _self.focusLevel = itemDom.data("levelkey")
                    // _self._showLevel()
                    //展开当前分类
                    var _this = this
                    _click(itemDom[0], itemDom.data("levelkey"), false)

                    _self._getResult(itemDom).then(function (data) {
                        if (_self.columnQueue[$(_this).attr("data-columnkey")]) {
                            _self.columnQueue[$(_this).attr("data-columnkey")].find("li").each(function () {
                                var iscategory = $(this).data("iscategory")
                                if (!iscategory || _self.options.selectcate) { // 不是分类，或者分类可选择的时候，执行
                                    $(this).data("select", !isChecked)
                                    var currlevel = $(this).data("levelkey")
                                    _click(this, currlevel, true)
                                }

                            })
                        }
                    })
                    //阻止冒泡
                    e.stopPropagation();
                })
                list.on("click", "li div.levellistselecthalfcheckbox", function () {

                    list.find("li span>input[name=levellistselectallcheckbox]").click()
                })
            }
            //路径点击事件
            if (this.panel.path) {
                var _self = this;
                var path = this.panel.path
                path.on("click", "span", function () {
                    var levelkey = $(this).data("levelkey")
                    var columnkey = $(this).data("columnkey") || _self.options.root
                    _self.focusLevel = levelkey - 1 < 0 ? 0 : levelkey - 1
                    this.firstLevel = _self.focusLevel

                    _self._expendResult(_self.resultQueue[columnkey], levelkey, columnkey)
                })
            }

        },
        //初始化选中数据
        _initSelected: function () {

            if (!this.panel.select) return;
            var item, obj, items = this.options.valueitems
            if (!this.options.valueitems) {
                this.options.valueitems = []
                items = this.val().split(this.options.valuesplit)
            } else {
                this.options.valueitems = []
            }

            for (var i in items) {
                item = null
                obj = items[i]

                if ($.isPlainObject(obj)) {
                    item = obj
                } else if (typeof obj == "string") {

                    if ($.trim(obj) != "") {
                        item = {}
                        if (this.options.valuefield == this.options.pathfield) {
                            var _obj = obj.split(this.options.pathsplit)
                            item[this.options.valuefield] = _obj
                            item[this.options.label] = _obj[_obj.length - 1]
                        } else {
                            item[this.options.valuefield] = obj
                            item[this.options.label] = obj
                        }

                        var fs = this.options.autofields
                        for (var field in fs) {
                            item[field] = $("[name=" + fs[field] + "]").val().split(this.options.valuesplit)[i] || "";
                        }
                        this.options.valueitems.push(item)
                    }

                }
                //this.selectQueue.push(item)
                if (item)
                    this.panel.select.append(this._getSelectDom(item))
            }

            //
            //console.log(items)

        },
        //刷新选中路径
        _refreshPath: function () {

            if (!this.panel.path) return true
            var _self = this;
            var pathDoms = this.panel.path.find("span")
            //添加根
            var root
            if (pathDoms.length == 0) {
                root = $("<span  style='cursor: pointer'>" + this.options.rootlabel + "</span>")
                root.append(">")
                root.data("levelkey", 0)
                root.data("columnkey", this.options.root)
                this.panel.path.append(root)
            } else {
                root = pathDoms.filter(":first");
                root.text(this.options.rootlabel)
                root.append(">")
            }

            var focusLevel = this.focusLevel , itemDom = this.focusItemQueue[focusLevel]
            pathDoms.css({
                "font-weight": "normal"
            })
            if (itemDom && itemDom.data("item") && itemDom.data("item")[this.options.label]) {
                var node = pathDoms.filter("span:eq(" + (focusLevel + 1) + ")")
                var currcolkey = node.data("columnkey") || ""

                var newcolkey = itemDom.data("item")[this.store.idProperty]
                if (node.length == 0) {
                    node = $("<span style='cursor: pointer'></span>")
                    this.panel.path.append(node)
                }
                node.data("levelkey", focusLevel + 1)
                if (itemDom.data("item")) {
                    node.data("columnkey", newcolkey)
                }
                node.text(itemDom.data("item")[this.options.label] + ">")

                node.css({
                    "color": "#000000",
                    "font-weight": "bold"
                })
                node.show()
                if (currcolkey != newcolkey) {
                    pathDoms.filter("span:gt(" + (focusLevel + 1) + ")").hide()
                } else {
                    pathDoms.filter("span:gt(" + (focusLevel + 1) + ")").css({
                        "color": "#999999",
                        "font-weight": "normal"
                    })
                }
            }

        },
        //刷新Item样式,flag 为fals仅更新当前节点样式
        _refreshItemCss: function (itemDom) {
            var css = {
                // "background-color":itemDom.data("focus")&&itemDom.data("select")?"#ffff99":itemDom.data("focus")?"#ffffcc":itemDom.data("select")?"#cceeff":itemDom.data("subselect")?"#cceeee":"",
                // "font-weight":"normal",
                "background-color": "",
                "font-weight": ""
            }
            //更新itemDom自身样式

            if (itemDom.data("focus")) {
                $.extend(css, {
                    "background-color": "#cceeff",
                    "font-weight": "bolder"
                })
            }
            if (itemDom.data("select")) {

                $.extend(css, {
                    "background-color": "#ccffff"
                })
            } else {
                var type = itemDom.data("selectstatus") || 0
                //  if(itemDom.data("selectstatus"))
                $.extend(css, {
                    "background-color": type == 1 ? "#eeffff" : type == 2 ? "#cceeff" : ""
                })
            }
            itemDom.css(css)
        },
        _refreshParentCss: function (itemDom) {
            if (!this.options.multi) return
            var levelkey = itemDom.data("levelkey") - 1
            var columnkey = itemDom.data("columnkey")
            if (levelkey < 0) {
                return false
            }
            var selType = 0; //0 没有选择，1，部分选择，2全部选择
            //console.log(this.columnQueue,columnkey)
            var nodesDom, nodesCount
            if (this.columnQueue[columnkey]) {
                nodesDom = this.columnQueue[columnkey].find("li"), nodesCount = nodesDom.length
            } else {
                nodesDom = this.panel.lists.find("ul[data-columnkey=" + columnkey + "] li"), nodesCount = nodesDom.length
            }
            var selectedDom = nodesDom.filter("[data-selected=true]"), selCount = selectedDom.length
            selType = nodesCount - selCount == 0 ? 2 : nodesCount - selCount == nodesCount ? 0 : 1
            var nodeDom = this.panel.lists.find("[data-itemkey=" + columnkey + "]");
            var checkBox = nodeDom.find("[name=levellistselectallcheckbox]");
            var halfBox = nodeDom.find("div.levellistselecthalfcheckbox");
            halfBox.remove()

            nodeDom.data("selectstatus", selType)
            if (selType == 0) {
                checkBox.attr("checked", false)
            } else if (selType == 2) {
                checkBox.attr("checked", true)
            } else {
                checkBox.attr("checked", true)
            }
            this._refreshItemCss(nodeDom)

        },
        //创建一个item节点
        _createItemDom: function (item) {
            var li = $("<li class=\"levellistitem\" style=\"padding:0px 5px;margin:0px;clear: both; cursor: pointer;\"></li>");
            var label = $("<span class='levellistitemlabel' style='float: left;overflow: hidden;'></span>")
            var text = item[this.options.label] || item[0] || (item._columns && item[item._columns[0]]) || "undefined label"
            label.text(text)
            label.attr("title", text)
            label.width(this._textwidth)
            label.height(25)
            $.support.cssFloat && li.height(25)
            var ico = $("<span class='levellistitemico' style='float: left;'></span>"), ext = $("<span class='levellistitemext' style='float:right;height: 25px;line-height: 25px;'></span>")
            li.append(ico)
            li.append(label)
            li.append(ext)

            return li;
        },
        _showItemInfo: function (item) {
            if (!this.panel.info) return false
            var _self = this;
            this.panel.info.find("span[data-type=_iteminfo_]").each(function (i, el) {
                var layout = $(el).data("layout")
                var val = item[layout.field] || ""
                if (typeof layout.format == "function") {
                    val = layout.format.call(_self, val, item)
                }
                $(el).text(val)
            })


        },
        _getLevelDom: function (levelkey) {

            var leveldom = this.panel.lists.find(">li[data-levelkey=" + levelkey + "]")
            if (leveldom.length == 0) {
                leveldom = $("<li  style='overflow-y:scroll;float:left;padding: 0px;margin: 0px ;border: 1px solid #e9e9e9' data-levelkey='" + levelkey + "'></li>")
                leveldom.width(this._columnwidth)

                leveldom.height(this.panel.lists.height() - 10)
                this.panel.lists.append(leveldom)
            }

            return leveldom
        },
        _getColumnDom: function (data, levelkey, columnkey) {
            var _self = this;

            var leveldom = this.levelQueue[levelkey]
            //获取levelDom
            if (!leveldom) {
                leveldom = this.levelQueue[levelkey] = this._getLevelDom(levelkey)
            }
            //获取columnDom
            var columndom = leveldom.find(">ul[data-columnkey='" + columnkey + "']")

            var _path = []

            // var _hasdom=columndom.length>0&&_self.options.cacheresult

            var _hasdom = columndom.length > 0 && columndom.data("data") != undefined

            if (_hasdom) {
                for (var i in columndom.data("data")) {
                    if (columndom.data("data")[i][this.store.idProperty] != data[i][this.store.idProperty]) {
                        _hasdom = false
                    }
                }
            }
            //   console.log(_hasdom)
            if (!_hasdom) {
                leveldom.empty()
                columndom = $("<ul style='list-style: none;padding: 0px;margin: 0px;'  data-columnkey='" + columnkey + "'></ul>")
                columndom.data("data", data)
                leveldom.append(columndom)
                //  console.log(leveldom)
                //路径处理
                var _path = []
                if (levelkey > 0)
                    _path = this.focusItemQueue[levelkey - 1].data("item")[_self.options.pathfield]


                var emptySelect = []
                if (_self.options.multi) {
                    emptySelect = _self.panel.select.find("li[data-nomatch=true]")
                }

                $.each(data, function (i, item) {
                    //处理ITME的路径信息（如果item有路径信息，则不处理）

                    if (!item[_self.options.pathfield]) {
                        var _label = _self.options.pathfieldlabel == "" ? _self.options.label : _self.options.pathfieldlabel
                        item[_self.options.pathfield] = _path.concat(item[_label])
                    }

                    var label = _self._getItemDom(item, levelkey, columnkey)
                    label.data("item", item)
                    label.attr("data-itemkey", item[_self.store.idProperty])
                    label.data("levelkey", levelkey)
                    label.data("columnkey", columnkey)
                    columndom.append(label)
                    emptySelect.length > 0 && _self._matchSelect(label, emptySelect)
                })
                columndom.hide();
            }

            _self.columnQueue[columnkey] = columndom

            return columndom
        },
        _getItemDom: function (item, levelkey, columnkey) {
            return this._createItemDom(item)
        },
        //返回一个选择后的节点
        _getSelectDom: function (itemDom) {

            var checkbox = $("<input type='checkbox' style='float: left;' checked name='levellistitemcheckbox'/>")
            var item , _dom
            var li
            if ($.isPlainObject(itemDom)) {
                item = itemDom

                _dom = null
            } else {

                item = itemDom.data("item")
                _dom = itemDom
            }
            li = this._createItemDom(item);
            if (item[this.store.idProperty]) {
                li.attr("data-itemkey", item[this.store.idProperty])
            } else {
                li.attr("data-nomatch", true)
            }
            if (item[this.options.pathfield]) {
                li.attr("title", item[this.options.pathfield].join(this.options.pathsplit))
            }
            checkbox.data("selectdom", li)
            checkbox.data("itemdom", _dom)
            li.prepend(checkbox)
            li.data("item", item)
            return li
        },
        //显示隐藏SelectItemDom
        _showSelectDom: function (dom) {
            dom.css({
                "background-color": "#ffffcc",
                "opacity": "0.3"
            })
            // dom.fadeTo(150, 0.25, function () {

            dom.fadeTo(350, 1, function () {
                dom.css({
                    "background-color": ""
                })
            })
            // });

            // dom.show()
        },
        _hideSelectDom: function (dom) {

            dom.css({
                "background-color": "#ccffff"
            })
            dom.fadeTo(450, 0.25, function () {
                dom.remove()

            });

        },
        //载入result，并进行后续处理
        _expendResult: function (result, levelkey, columnkey) {

            this._currentResult = result
            var _self = this;
            var levelkey = levelkey || 0

            result.then(function (data) {

                _self._showLevel(data.length == 0);
                var column = _self._showColumn(data, levelkey, columnkey)
                _self._refreshPath()
                return
            })
        },
        //检查并显示层级
        _showLevel: function (flag) {
            //flag ：true,无数据，false，有数据
            var _self = this;
            var interval = this.options.showcols - 2
            //计算当前面板的位置信息

            if (this.focusLevel - this.firstLevel >= interval) {  //当前位置与firstlevel 相差 showcols，则 更新firstlevel，
                if (flag && this.focusLevel > 0) this.focusLevel //20120618 取消focuslevel-1.修复一个单选bug。，需要观察后续是否会衍生新问题
                this.firstLevel = this.focusLevel - interval
            } else if (this.focusLevel <= this.firstLevel && this.focusLevel > 0) {  //当前位置小于firstlevel  更新firstlevel = focusLevel-1，
                this.firstLevel = this.focusLevel - 1
            } else if (this.focusLevel == 0) {
                this.firstLevel = this.focusLevel
            }
            if (this.firstLevel < 0)this.firstLevel = 0
            this.lastLevel = this.firstLevel + interval + 1
            //this.lastLevel = this.focusLevel +1
            //控制面板及内容的显示

            for (var i in this.levelQueue) {
                //当前点击的focusLevel不会隐藏
                if ((i < this.firstLevel || i > this.lastLevel) && i != this.focusLevel) {
                    var _levelpanel = this.levelQueue[i]
                    _levelpanel.data("scrollTop", _levelpanel.scrollTop())
                    _levelpanel.filter(":visible").hide("fast")
                } else {
                    //需要显示的level，如果是隐藏状态，则进行显示

                    this.levelQueue[i].filter(":hidden").show(0, function () {

                        var _levelpanel = $(this)
                        var _focusItemDom = _self.focusItemQueue[_levelpanel.data("levelkey")]

                        if (_levelpanel.data("scrollTop")) {
                            _levelpanel.scrollTop(_levelpanel.data("scrollTop"))
                        } else if (_focusItemDom) {
                            _levelpanel.scrollTop(_focusItemDom.position().top - _levelpanel.height())
                        }
                    })

                    //控制列表显示
                    if (this.focusItemQueue[i] && this.focusItemQueue[i].data("columnkey")) {
                        if (i > this.focusLevel + 1) {
                            this.levelQueue[i].find(">ul:visible").hide()
                            this.columnQueue[this.focusItemQueue[i].data("columnkey")].hide()
                        } else {

                            this.columnQueue[this.focusItemQueue[i].data("columnkey")].filter(":hidden").show()
                        }
                    } else {
                        if (flag) {
                            if ((i > this.firstLevel))
                                this.levelQueue[i].find(">ul:visible").hide()
                        } else {
                            if (i > this.focusLevel + 1) {
                                this.levelQueue[i].find(">ul:visible").hide()
                            }
                        }
                    }
                }
            }
        },
        //显示具体的列
        _showColumn: function (data, levelkey, columnkey) {
            if (levelkey > this.lastLevel) return
            var currentcolumn
            //  var columnkey = data.__foreignkey;

            if (this.levelQueue[levelkey]) {

                currentcolumn = this.levelQueue[levelkey].find(">ul:visible")
                if (data.length == 0) {
                    currentcolumn.hide()
                    return;
                } else {
                    //将 columnkey 不予要显示的列相同的果断因此
                    currentcolumn.filter("[data-columnkey!=" + columnkey + "]").hide()
                    currentcolumn = currentcolumn.filter("[data-columnkey=" + columnkey + "]")//.hide()

                    if (currentcolumn.length > 0 && this.options.cacheresult) {
                        return currentcolumn;
                    }
                }
            }
            //如果data不为空/当前显示的currentcolumn 内没有与要显示的columnkey一直到，则继续执行 /

            var column = this._getColumnDom(data, levelkey, columnkey)
            if (column[0].style.display == "none") {

                column.slideDown();
            }
            return column;
        },

        _getResult: function (itemDom) {
            var _self = this, result
            var resultkey = itemDom.data("item")[this.store.idProperty];
            // if(_self.options.cacheresult)
            var result = _self.options.cacheresult ? this.resultQueue[resultkey] : false;
            if (!result) {
                //初始化时载入数据，对数据进行处理
                result = this.resultQueue[resultkey] = this.store.getChildren(itemDom.data("item")).map(function (item) {
                    if (_self.options.itemformats) {
                        for (var i in _self.options.itemformats) {
                            if (item[i])
                                item[i] = _self.options.itemformats[i](item[i], item)
                        }
                    }
                    if (_self.filter(item)) {
                        return _self.map(item)
                    } else {
                        return null
                    }
                })
            }

            return result
        },
        //单击选择一个Item，执行召开操作
        _expendItemDom: function (itemDom, levelkey) {
            var _self = this;
            var result = this._getResult(itemDom)
            //  console.log(itemDom.data("item")[this.store.idProperty])
            this._expendResult(result, levelkey, itemDom.data("item")[this.store.idProperty]);
        },
        //被选择执行选中操作
        _onselect: function (itemDom) {


            var item = itemDom.data("item")
            var _self = this

            if (this.options.multi) {
                itemDom.data("select", !itemDom.data("select"))
                itemDom.attr("data-selected", itemDom.data("select"))

                this._refreshItemCss(itemDom)
                var itemkey = item[this.store.idProperty]
                var selectDom = this.panel.select.find("li[data-itemkey=" + itemkey + "]")
                if (itemDom.data("select")) {

                    if (selectDom.length == 0) {
                        selectDom = this._getSelectDom(itemDom)
                        this.panel.select.append(selectDom)
                    }

                    this.panel.select.parent().scrollTop(this.panel.select.height())
                    this._showSelectDom(selectDom)
                } else {
                    if (selectDom.length > 0) {

                        var _top = selectDom.position().top
                        if (_top < 0) {
                            _top = this.panel.select.parent().scrollTop() + _top - this.panel.select.height()
                            this.panel.select.parent().scrollTop(_top)
                        } else if (_top + selectDom.height() > this.panel.select.parent().scrollTop()) {
                            _top = _top + selectDom.height()
                            this.panel.select.parent().scrollTop(_top)
                        }

                    }
                    this._hideSelectDom(selectDom)
                    // selectDom.remove()
                }

                this._refreshParentCss(itemDom)
                // console.log(_self. selectQueue)
            } else {

                //   else{
                // console.log(this.focusLevel)
                // if(_self.options.selectend){

                // }
                //  }
                _self.selectQueue = [item]
                _self._selected()
            }
        },
        //选中并确认，执行选择后操作
        _selected: function () {
            var _self = this
            ///将 计算selectQueue 调整到 _selected 内进行计算，以解决因动画延迟导致的选做错误
            if (this.options.multi && this.panel.select) {

                _self.selectQueue = []
                this.panel.select.find(">li[data-itemkey]:visible").each(function (i, selectDom) {
                    _self.selectQueue.push($(selectDom).data("item"))
                })

            } else {
                // 20120618  添加 selectend 控制
                var itemDom = this.focusItemQueue[_self.focusLevel]
                if (itemDom) {
                    //  console.log(this.focusLevel)
                    if (!this.options.selectcate && itemDom.data("iscategory")) {
                        return false
                    }

                    if (this.options.selectend) {
                        if (this.focusLevel + 1 != this.options.leveldepth && this.options.leveldepth > 0) {
                            return false;
                        }
                        //console.log(this.focusLevel+1,this.options.leveldepth)
                    }
                } else {
                    return false
                }

            }

            if (typeof this.onselect == "function") {
                var items = [].concat(this.selectQueue)
                if (this.options.valueitems)
                    for (var i in this.options.valueitems) {
                        items.push(this.options.valueitems[i])
                    }
                if (this.onselect(items)) {
                    //处理自动完成的域
                    if (this.options.autofields) {
                        var fields = this.options.autofields
                        var items, vals = []
                        if ($.isPlainObject(fields)) {
                            for (var i in fields) {
                                vals = []
                                items = this.selectQueue
                                for (var j in items) {
                                    vals.push(items[j][i] || "")
                                }
                                $("[name=" + fields[i] + "]").val(vals.join(this.options.valuesplit))
                            }
                        }
                    }
                    this.close()
                }
            }
            this.trigger("selected", [this, items])
        },
        close: function () {
            if (util.isIE6)
                $('select').css('visibility', 'visible')

            this.doms.dialog.hide()
            //  this.dialog.hide()
        },
        //默认选择事件
        onselect: function (items) {
            var val = []
            var _self = this
            $.each(items, function (i, item) {
                if (_self.options.valuefield == _self.options.pathfield)
                    val.push(item[_self.options.valuefield].join(_self.options.pathsplit))
                else {
                    val.push(item[_self.options.valuefield])
                }
            })
            this.val(val.join(_self.options.valuesplit))
            return true
        },
        _empty: function () {
            var _self = this
            if (this.options.multi) {
                this.panel.select.find("input[name=levellistitemcheckbox]").each(function (i, checkbox) {
                    var itemDom = $(checkbox).data("itemdom")
                    if (itemDom) {
                        itemDom.data("select", false)
                        _self._refreshItemCss(itemDom)
                    }
                })
                this.panel.select.empty()
            }
            this.selectQueue = []
            this.options.valueitems = []

        },
        //匹配选择项目并进行处理
        _matchSelect: function (itemDom, selectDoms) {
            var item = itemDom.data("item")
            var _self = this
            selectDoms.filter("[data-nomatch=true]").each(function (i, el) {
                if (_self.matchSelect(item, $(el).data("item"))) {
                    _self.options.valueitems = $.grep(_self.options.valueitems, function (item, i) {
                        return (item != $(el).data("item"))
                    })
                    $(el).attr("data-nomatch", false)
                    $(el).attr("data-itemkey", item[_self.store.idProperty])
                    $(el).find("input[name=levellistitemcheckbox]").data("itemdom", itemDom)
                    $(el).data("item", item)
                    _self._onselect(itemDom)
                }
            })
        },

        //匹配选择项，返回true or false
        matchSelect: function (itemOrg, itemSel) {
            if (itemSel[this.store.idProperty]) {
                return itemSel[this.store.idProperty] == itemOrg[this.store.idProperty]
            } else if (itemSel[this.options.pathfield]) {
                var a = $.trim(itemSel[this.options.pathfield].join(""))
                var b = $.trim(itemOrg[this.options.pathfield].join(""))
                return a == b
            } else if (itemSel[this.options.label]) {
                return $.trim(itemSel[this.options.label]) == $.trim(itemOrg[this.options.label])
            }
        },
        //修改返回结果的item，如果返回null，则删除这个item
        //刷新界面
        refresh: function () {

        },
        //选择
        select: function () {
            return false
        },
        map: function (item) {
            if (typeof this.options.map == "function") {
                return this.options.map(item)
            } else {
                return item
            }
            return item
        },
        //过来item，返回false，则该item被过滤
        filter: function (item) {
            if (typeof this.options.filter == "function") {
                return this.options.filter(item)
            } else {
                return true
            }
        }
    })
    return levelselect;
})
"use strict";

define(['logManager',
    'clientUtil',
    'js/DiagramDesigner/DecoratorBase',
    'text!js/ModelEditor3/Decorators/DecoratorWithPorts/DecoratorWithPortsTemplate.html',
    'js/DiagramDesigner/NodePropertyNames',
    'js/ModelEditor3/Decorators/DecoratorWithPorts/Port',
    'css!ModelEditor3CSS/Decorators/DecoratorWithPorts/DecoratorWithPorts'], function (logManager,
                                                          util,
                                                          DecoratorBase,
                                                          decoratorWithPortsTemplate,
                                                          nodePropertyNames,
                                                          Port) {

    var DecoratorWithPorts,
        __parent__ = DecoratorBase,
        __parent_proto__ = DecoratorBase.prototype,
        DECORATOR_ID = "DecoratorWithPorts",
        GME_ID = "GME_ID";

    DecoratorWithPorts = function (options) {

        var opts = _.extend( {}, options);

        __parent__.apply(this, [opts]);

        this.name = "";
        this._portIDs = [];
        this._ports = {};
        this._skinParts = { "$name": undefined,
                            "$portsContainer": undefined,
                            "$portsContainerLeft": undefined,
                            "$portsContainerRight": undefined,
                            "$portsContainerCenter": undefined };

        this.logger.debug("DecoratorWithPorts ctor");
    };

    _.extend(DecoratorWithPorts.prototype, __parent_proto__);
    DecoratorWithPorts.prototype.DECORATORID = DECORATOR_ID;

    /*********************** OVERRIDE DECORATORBASE MEMBERS **************************/

    DecoratorWithPorts.prototype.$DOMBase = $(decoratorWithPortsTemplate);

    DecoratorWithPorts.prototype.on_addTo = function () {
        var client = this._control._client,
            nodeObj = client.getNode(this._metaInfo.GMEID),
            childrenIDs,
            len;

        //render GME-ID in the DOM, for debugging
        this.$el.attr({"data-id": this._metaInfo.GMEID});

        /* BUILD UI*/
        //find name placeholder
        this.skinParts.$name = this.$el.find(".name");
        this.skinParts.$portsContainer = this.$el.find(".ports");
        this.skinParts.$portsContainerLeft = this.skinParts.$portsContainer.find(".left");
        this.skinParts.$portsContainerRight = this.skinParts.$portsContainer.find(".right");
        this.skinParts.$portsContainerCenter = this.skinParts.$portsContainer.find(".center");

        /* FILL WITH DATA */
        if (nodeObj) {
            this.name = nodeObj.getAttribute(nodePropertyNames.Attributes.name) || "";
            this.skinParts.$name.text(this.name);

            childrenIDs = nodeObj.getChildrenIds();
            len = childrenIDs.length;

            while (len--) {
                this._renderPort(client.getNode(childrenIDs[len]));
            }
        }


    };

    DecoratorWithPorts.prototype.calculateDimension = function () {
        this.hostDesignerItem.width = this.$el.outerWidth(true);
        this.hostDesignerItem.height = this.$el.outerHeight(true);

        this.offset = this.$el.offset();
        var i = this._portIDs.length;

        while (i--) {
            this._ports[this._portIDs[i]].calculateConnectorLocation();
        }
    };

    DecoratorWithPorts.prototype.update = function () {
        var client = this._control._client,
            nodeObj = client.getNode(this._metaInfo.GMEID),
            newName = "";

        if (nodeObj) {
            newName = nodeObj.getAttribute(nodePropertyNames.Attributes.name) || "";

            if (this.name !== newName) {
                this.name = newName;
                this.skinParts.$name.text(this.name);
            }
        }

        this._updatePorts();
    };

    DecoratorWithPorts.prototype.getConnectionAreas = function (id) {
        var result = [];

        //by default return the bounding box edges midpoints

        if (id === undefined || id === this.hostDesignerItem.id) {
            //top left
            result.push( {"id": "0",
                "x": this.hostDesignerItem.width / 2,
                "y": 0,
                "w": 0,
                "h": 0,
                "orientation": "N"} );

            result.push( {"id": "1",
                "x": this.hostDesignerItem.width / 2,
                "y": this.hostDesignerItem.height,
                "w": 0,
                "h": 0,
                "orientation": "S"} );
        } else {
            //subcomponent
            var loc = this._ports[id].getConnectorLocation(),
                adjX = loc.left - this.offset.left,
                adjY = loc.top - this.offset.top;

            result.push( {"id": "1",
                "x": adjX,
                "y": adjY,
                "w": 0,
                "h": 0,
                "orientation": "E"} );
        }


        return result;
    };

    /***************  CUSTOM DECORATOR PART ****************************/
    DecoratorWithPorts.prototype._updatePorts = function () {
        var client = this._control._client,
            nodeObj = client.getNode(this._metaInfo.GMEID),
            newChildrenIDs = nodeObj ?  nodeObj.getChildrenIds() : [],
            len,
            currentChildrenIDs = this._portIDs.slice(0),
            addedChildren,
            removedChildren;

        removedChildren = util.arrayMinus(currentChildrenIDs, newChildrenIDs);
        len = removedChildren.length;
        while (len--) {
            this._removePort(removedChildren[len]);
        }

        addedChildren = util.arrayMinus(newChildrenIDs, currentChildrenIDs);
        len = addedChildren.length;
        while (len--) {
            this._renderPort(client.getNode(addedChildren[len]));
        }
    };

    DecoratorWithPorts.prototype._renderPort = function (portNode) {
        var portId = portNode.getId();

        this._ports[portId] = new Port(portId, { "title": portNode.getAttribute(nodePropertyNames.Attributes.name),
                                                "decorator": this});

        this._portIDs.push(portId);
        this._addPortToContainer(portNode);
        this.hostDesignerItem.registerSubcomponent(portId, {"GME_ID": portId});
    };

    DecoratorWithPorts.prototype._removePort = function (portId) {
        var idx = this._portIDs.indexOf(portId);

        if (idx !== -1) {
            this._ports[portId].destroy();
            delete this._ports[portId];
            this._portIDs.splice(idx,1);
            this.hostDesignerItem.unregisterSubcomponent(portId);
        }
    };

    DecoratorWithPorts.prototype._addPortToContainer = function (portNode) {
        var portId = portNode.getId(),
            portOrientation = "W",
            portContainer = this.skinParts.$portsContainerLeft,
            portPosition = portNode.getRegistry(nodePropertyNames.Registry.position),
            portToAppendBefore = null,
            i;

        //check if the port should be on the left or right-side
        if (portPosition.x > 300) {
            portOrientation = "E";
            portContainer = this.skinParts.$portsContainerRight;
        }

        this._ports[portId].updateOrPos(portOrientation, portPosition);

        //find its correct position
        for (i in this._ports) {
            if (this._ports.hasOwnProperty(i)) {
                if (i !== portId) {
                    if (this._ports[i].orientation === this._ports[portId].orientation) {
                        if ((this._ports[portId].position.y < this._ports[i].position.y) ||
                            ((this._ports[portId].position.y === this._ports[i].position.y) && (this._ports[portId].title < this._ports[i].title))) {
                            if (portToAppendBefore === null) {
                                portToAppendBefore = i;
                            } else {
                                if ((this._ports[i].position.y < this._ports[portToAppendBefore].position.y) ||
                                    ((this._ports[i].position.y === this._ports[portToAppendBefore].position.y) && (this._ports[i].title < this._ports[portToAppendBefore].title))) {
                                    portToAppendBefore = i;
                                }
                            }
                        }
                    }
                }
            }
        }

        if (portToAppendBefore === null) {
            portContainer.append(this._ports[portId].$el);
        } else {
            this._ports[portId].$el.insertBefore(this._ports[portToAppendBefore].$el);
        }
    };

    DecoratorWithPorts.prototype.attachConnectableSubcomponent = function (el, sCompID) {
        this.hostDesignerItem.attachConnectable(el, sCompID);
    };

    DecoratorWithPorts.prototype.detachConnectableSubcomponent = function (el) {
        this.hostDesignerItem.detachConnectable(el);
    };

    DecoratorWithPorts.prototype.destroy = function () {
        var len = this._portIDs.length;
        while (len--) {
            this._removePort(this._portIDs[len]);
        }
    };

    return DecoratorWithPorts;
});
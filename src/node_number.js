/*global CSL: true */

CSL.Node.number = {
    build: function (state, target) {
        var func;
        CSL.Util.substituteStart.call(this, state, target);
        //
        // This should push a rangeable object to the queue.
        //
        if (this.strings.form === "roman") {
            this.formatter = state.fun.romanizer;
        } else if (this.strings.form === "ordinal") {
            this.formatter = state.fun.ordinalizer;
        } else if (this.strings.form === "long-ordinal") {
            this.formatter = state.fun.long_ordinalizer;
        }
        if ("undefined" === typeof this.successor_prefix) {
            this.successor_prefix = state[state.build.area].opt.layout_delimiter;
        }
        if ("undefined" === typeof this.splice_prefix) {
            this.splice_prefix = state[state.build.area].opt.layout_delimiter;
        }
        // is this needed?
        //if ("undefined" === typeof this.splice_prefix){
        //    this.splice_prefix = state[state.tmp.area].opt.layout_delimiter;
        //}
        //
        // Whether we actually stick a number object on
        // the output queue depends on whether the field
        // contains a pure number.
        //
        // push number or text
        func = function (state, Item, item) {
            var i, ilen, newlst, lst;
            // NOTE: this works because this is the ONLY function in this node.
            // If further functions are added, they need to start with the same
            // abort condition.
            if (this.variables.length === 0) {
                return;
            }
            if ("undefined" === typeof item) {
                var item = {};
            }
            var varname, num, number, m, j, jlen;
            varname = this.variables[0];
            if (varname === "locator" && state.tmp.just_looking) {
                return;
            }
            state.parallel.StartVariable(this.variables[0]);
            if (this.variables[0] === "locator") {
                state.parallel.AppendToVariable(Item.section);
            } else {
                state.parallel.AppendToVariable(Item[this.variables[0]]);
            }

            var rex = new RegExp("(?:&|, | and |" + state.getTerm("page-range-delimiter") + ")");
            
            if (varname === 'collection-number' && Item.type === 'legal_case') {
                state.tmp.renders_collection_number = true;
            }
            
            // Only allow the suppression of a year identical
            // to collection-number if the container-title
            // is rendered after collection-number.
            var value = Item[this.variables[0]];
            
            var form = "long";
            if (this.strings.label_form_override) {
                form = this.strings.label_form_override;
            }
            
            // For bill or legislation items that have a label-form
            // attribute set on the cs:number node rendering the locator,
            // the form and pluralism of locator terms are controlled
            // separately from those of the initial label. Form is
            // straightforward: the label uses the value set on
            // the cs:label node that renders it, and the embedded
            // labels use the value of label-form set on the cs:number
            // node. Both default to "long".
            //
            // Pluralism is more complicated. For embedded labels,
            // pluralism is evaluated using a simple heuristic that
            // can be found below (it just looks for comma, ampersand etc).
            // The item.label rendered independently via cs:label
            // defaults to singular. It is always singular if embedded
            // labels exist that (when expanded to their valid CSL
            // value) do not match the value of item.label. Otherwise,
            // if one or more matching embedded labels exist, the
            // cs:label is set to plural.
            //
            // The code that does all this is divided between this module,
            // util_static_locator.js, and util_label.js. It's not easy
            // to follow, but seems to do the job. Let's home for good
            // luck out there in the wild.
            
            var node = this;

            if (varname === "locator") {
                state.processNumber(node, item, varname, Item.type);
            } else {
                state.processNumber(node, Item, varname, Item.type);
            }

            //var values = state.tmp.shadow_numbers[varname].values;
            //var blob;

            state.output.openLevel(state.tmp.shadow_numbers[varname].masterStyling);
            
            var nums = state.tmp.shadow_numbers[varname].values;
            var labelForm = state.tmp.shadow_numbers[varname].labelForm;
            for (var i=0,ilen=nums.length;i<ilen;i++) {
                var num = nums[i];
                if (num.labelVisibility) {
                    var label = CSL.STATUTE_SUBDIV_STRINGS[num.label];
                    // And add a trailing delimiter.
                    label = state.getTerm(label, labelForm, num.plural);
                    if (!label) {
                        label = num.label;
                    }
                    state.output.append(label+num.labelSuffix, "empty");
                }
                if (num.collapsible) {
                    var blob = new CSL.NumericBlob(num.particle, parseInt(num.value, 10), num.styling, Item.id);
                    if ("undefined" === typeof blob.gender) {
                        blob.gender = state.locale[state.opt.lang]["noun-genders"][varname];
                    }
                    state.output.append(blob, "literal");
                } else {
                    state.output.append(num.particle + num.value, num.styling)
                }
            }

            state.output.closeLevel("empty");

            state.parallel.CloseVariable("number");
            if (["locator", "locator-extra"].indexOf(this.variables[0]) > -1) { 
                state.tmp.done_vars.push(this.variables[0]);
            }
        };
        this.execs.push(func);
        target.push(this);
        
        CSL.Util.substituteEnd.call(this, state, target);
    }
};

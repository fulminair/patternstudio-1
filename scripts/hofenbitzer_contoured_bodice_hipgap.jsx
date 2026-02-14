(function() {
    if (app.documents.length === 0) {
        app.documents.add();
    } else {
        var activeDoc = app.activeDocument;
        if (activeDoc && activeDoc.pageItems && activeDoc.pageItems.length > 0) {
            app.documents.add();
        }
    }
    var doc = app.activeDocument;

    function cm(val) {
        return val * 28.3464566929;
    }

    function ptToCm(val) {
        return val / 28.3464566929;
    }
    var latestDerived = null;
    var lastRecommendedOptimalBalanceText = null;
    var measurementPalette = null;
    var defaults = {
        AhD: 20.1,
        NeG: 6.5,
        MoL: 75,
        BL: 41.6,
        BLBal: 0,
        HiD: 20,
        BackContour: 2,
        BackShoulderDartIntake: 1.5,
        FitIndex: 1,
        BG: 16.5,
        AG: 9.3,
        BrG: 18.2,
        BrC: 88,
        WaC: 68,
        HiC: 97,
        ShG: 12.2,
        BrD: 28.1,
        FL: 45.3,
        BackShoulderEase: 0.7,
        OptimalBalance: 3.5,
        ShA: 20,
        ShoulderDifference: 2,
        ShowMeasurementPalette: false,
        FrontWaistDartAddition: 1,
        FrontDartLength: 12,
        MainBackDartLength: 15,
        SecondBackDartLength: 13
    };

    function computeFrontWaistDartAdditionDefault(fitIndex) {
        var fitNumber = (typeof fitIndex === 'number' ? fitIndex : defaults.FitIndex) + 1;
        if (fitNumber >= 8) return 0;
        if (fitNumber >= 5) return 0.5;
        return 1;
    }
    var frontDartLengthValue = defaults.FrontDartLength;
    var mainBackDartLengthValue = defaults.MainBackDartLength;
    var secondBackDartLengthValue = defaults.SecondBackDartLength;
    var FIT_PROFILES = [{
        name: 'Fit 0',
        ease: {
            AhD: 0.25,
            BrC: 0,
            WaC: 0,
            HiC: 0,
            BG: 0,
            AG: 0,
            BrG: 0,
            ShG: 0
        },
        notes: {
            AhD: '0 - 0.5 cm',
            BrC: '0 cm',
            WaC: '0 cm',
            HiC: '0 cm'
        }
    }, {
        name: 'Fit 1',
        ease: {
            AhD: 0.45,
            BrC: 2,
            WaC: 1,
            HiC: 1,
            BG: 0.1,
            AG: 0.3,
            BrG: 0.6,
            ShG: 0.1
        },
        notes: {
            AhD: '0.2 - 0.7 cm',
            BrC: '2 cm',
            WaC: '0 - 2 cm',
            HiC: '0 - 2 cm'
        }
    }, {
        name: 'Fit 2',
        ease: {
            AhD: 0.75,
            BrC: 4,
            WaC: 3,
            HiC: 3,
            BG: 0.3,
            AG: 0.9,
            BrG: 0.8,
            ShG: 0.2
        },
        notes: {
            AhD: '0.5 - 1.0 cm',
            BrC: '4 cm',
            WaC: '2 - 4 cm',
            HiC: '2 - 4 cm'
        }
    }, {
        name: 'Fit 3',
        ease: {
            AhD: 1.3,
            BrC: 6,
            WaC: 5,
            HiC: 5,
            BG: 0.5,
            AG: 1.5,
            BrG: 1.0,
            ShG: 0.3
        },
        notes: {
            BrC: '6 cm',
            WaC: '4 - 6 cm',
            HiC: '4 - 6 cm'
        }
    }, {
        name: 'Fit 4',
        ease: {
            AhD: 1.7,
            BrC: 8,
            WaC: 6,
            HiC: 6,
            BG: 0.8,
            AG: 2.0,
            BrG: 1.2,
            ShG: 0.4
        },
        notes: {
            BrC: '8 cm',
            WaC: '4 - 8 cm',
            HiC: '4 - 8 cm'
        }
    }, {
        name: 'Fit 5',
        ease: {
            AhD: 2.1,
            BrC: 10,
            WaC: 10,
            HiC: 7,
            BG: 1.1,
            AG: 2.5,
            BrG: 1.4,
            ShG: 0.5
        },
        notes: {
            BrC: '10 cm',
            WaC: '8 - 12 cm',
            HiC: '6 - 8 cm'
        }
    }, {
        name: 'Fit 6',
        ease: {
            AhD: 2.5,
            BrC: 12,
            WaC: 12,
            HiC: 8,
            BG: 1.4,
            AG: 3.0,
            BrG: 1.6,
            ShG: 0.6
        },
        notes: {
            BrC: '12 cm',
            WaC: '8 - 16 cm',
            HiC: '6 - 10 cm'
        }
    }];
    var MEASURE_ROWS = [{
        id: 'AhD',
        label: '1. AhD',
        defaultValue: defaults.AhD
    }, {
        id: 'BrC',
        label: '2. BrC',
        defaultValue: defaults.BrC
    }, {
        id: 'WaC',
        label: '3. WaC',
        defaultValue: defaults.WaC
    }, {
        id: 'HiC',
        label: '4. HiC',
        defaultValue: defaults.HiC
    }, {
        id: 'BG',
        label: '5. BG',
        defaultValue: defaults.BG
    }, {
        id: 'AG',
        label: '6. AG',
        defaultValue: defaults.AG
    }, {
        id: 'BrG',
        label: '7. BrG',
        defaultValue: defaults.BrG
    }, {
        id: 'ShG',
        label: '8. ShG',
        defaultValue: defaults.ShG
    }];
    var BL_NUMBER = MEASURE_ROWS.length + 1;
    var BL_ROW_DEF = {
        id: 'BL',
        label: BL_NUMBER + '. BL',
        defaultValue: defaults.BL,
        finalLabel: BL_NUMBER + '. BL (final)'
    };
    var FL_NUMBER = BL_NUMBER + 1;
    var SECONDARY_ROWS = [{
        id: 'NeG',
        label: '11. NeG',
        defaultValue: defaults.NeG,
        easeOptions: {
            enabled: false
        },
        finalLabel: '11. NeG (final)',
        finalOptions: {
            enabled: false
        }
    }, {
        id: 'MoL',
        label: '12. MoL',
        defaultValue: defaults.MoL,
        easeOptions: {
            enabled: false
        },
        finalLabel: '12. MoL (final)',
        finalOptions: {
            enabled: false
        }
    }, {
        id: 'HiD',
        label: '13. HiD',
        defaultValue: defaults.HiD,
        easeOptions: {
            enabled: false
        },
        finalLabel: '13. HiD (final)',
        finalOptions: {
            enabled: false
        }
    }, {
        id: 'ShA',
        label: '14. ShA (deg)',
        defaultValue: defaults.ShA,
        easeOptions: {
            enabled: false
        },
        finalLabel: '14. ShA (deg)',
        finalOptions: {
            enabled: false
        }
    }, {
        id: 'BrD',
        label: '15. BrD',
        defaultValue: defaults.BrD,
        easeOptions: {
            enabled: false
        },
        finalLabel: '15. BrD (final)',
        finalOptions: {
            enabled: false
        }
    }];

    function fitNames() {
        var names = [];
        for (var i = 0; i < FIT_PROFILES.length; i++) names.push(FIT_PROFILES[i].name);
        return names;
    }
    var dlg = new Window('dialog', 'Measurement Panel (Default Size: 38, Fit 3)');
    dlg.orientation = 'column';
    dlg.alignChildren = 'left';
    dlg.spacing = 12;
    var mainColumns = dlg.add('group');
    mainColumns.orientation = 'row';
    mainColumns.alignChildren = 'top';
    mainColumns.alignment = 'fill';
    mainColumns.spacing = 12;
    var measurementPanel = mainColumns.add('panel', undefined, 'Measurement Panel (Default Size: 38, Fit 3)');
    measurementPanel.orientation = 'column';
    measurementPanel.alignChildren = 'fill';
    measurementPanel.margins = 12;
    measurementPanel.spacing = 12;
    measurementPanel.alignment = 'fill';
    var optionsPanel = mainColumns.add('panel', undefined, 'Options');

    function addFieldRow(panel, label, defaultValue, options) {
        options = options || {};
        var row = panel.add('group');
        row.alignChildren = ['left', 'center'];
        var caption = label;
        if (options.note) caption += ' (' + options.note + ')';
        var st = row.add('statictext', undefined, caption + ':');
        if (options.labelWidth !== undefined) {
            st.minimumSize.width = options.labelWidth;
            st.preferredSize.width = options.labelWidth;
        }
        if (options.helpTip) {
            try {
                st.helpTip = options.helpTip;
            } catch (eHelpLabel) {}
        }
        if (options.note) {
            try {
                st.graphics.font = ScriptUI.newFont('dialog', 'italic', 8);
            } catch (eFont) {}
        }
        if (options && options.type === 'checkbox') {
            var checkbox = row.add('checkbox', undefined, '');
            checkbox.value = !!defaultValue;
            return checkbox;
        } else {
            var field = row.add('edittext', undefined, (defaultValue !== null && defaultValue !== undefined && defaultValue !== '') ? String(defaultValue) : '');
            field.characters = options.characters || 8;
            if (options.helpTip) {
                try {
                    field.helpTip = options.helpTip;
                } catch (eHelpField) {}
            }
            if (options.enabled === false) {
                try {
                    field.enabled = false;
                } catch (eOff) {}
            }
            return field;
        }
    }
    var columnWidths = {
        measurement: 210,
        ease: 180,
        construction: 210
    };
    var columnLabelWidths = {
        measurement: 120,
        ease: 120,
        construction: 140
    };
    var optionsLabelWidth = 220;
    var fitRow = measurementPanel.add('group');
    fitRow.orientation = 'row';
    fitRow.alignChildren = ['left', 'center'];
    fitRow.alignment = 'fill';
    fitRow.spacing = 6;
    fitRow.add('statictext', undefined, 'Fit Category:');
    var fitDropdown = fitRow.add('dropdownlist', undefined, fitNames());
    fitDropdown.selection = defaults.FitIndex;
    fitDropdown.preferredSize.width = 140;
    var headerRow = measurementPanel.add('group');
    headerRow.orientation = 'row';
    headerRow.alignChildren = ['left', 'center'];
    headerRow.spacing = 12;
    headerRow.alignment = 'fill';

    function addHeaderCell(label, width) {
        var header = headerRow.add('statictext', undefined, label);
        header.preferredSize.width = width;
        return header;
    }
    addHeaderCell('Main Measurement', columnWidths.measurement);
    addHeaderCell('Ease', columnWidths.ease);
    addHeaderCell('Construction Measurement', columnWidths.construction);
    var rowsContainer = measurementPanel.add('group');
    rowsContainer.orientation = 'column';
    rowsContainer.alignChildren = 'fill';
    rowsContainer.spacing = 6;
    rowsContainer.alignment = 'fill';

    function addDivider(target) {
        var dividerGroup = target.add('group');
        dividerGroup.alignment = 'fill';
        dividerGroup.margins = 0;
        var divider = dividerGroup.add('panel');
        divider.alignment = 'fill';
        divider.margins = 0;
        divider.minimumSize.height = 1;
        divider.maximumSize.height = 1;
    }

    function collapseGroup(group) {
        if (!group) return;
        try {
            group.visible = false;
        } catch (eVisibility) {}
        try {
            group.minimumSize.height = 0;
            group.maximumSize.height = 0;
        } catch (eHeight) {}
        try {
            group.margins = 0;
        } catch (eMargins) {}
        try {
            group.spacing = 0;
        } catch (eSpacing) {}
    }

    function configureDerivedField(field, labelWidth) {
        if (!field) return;
        var hostGroup = field.parent;
        if (!hostGroup) return;
        try {
            hostGroup.margins = 0;
        } catch (eMargin) {}
        try {
            hostGroup.spacing = 6;
        } catch (eSp) {}
        try {
            hostGroup.alignment = ['fill', 'top'];
        } catch (eAlign) {}
        if (labelWidth !== undefined) {
            for (var i = 0; i < hostGroup.children.length; i++) {
                if (hostGroup.children[i].type === 'statictext') {
                    try {
                        hostGroup.children[i].minimumSize.width = labelWidth;
                        hostGroup.children[i].preferredSize.width = labelWidth;
                    } catch (eWidth) {}
                    break;
                }
            }
        }
    }

    function addMeasurementRow(config) {
        config = config || {};
        var rowWrapper = rowsContainer.add('group');
        rowWrapper.orientation = 'column';
        rowWrapper.alignChildren = 'fill';
        rowWrapper.spacing = 6;
        var row = rowWrapper.add('group');
        row.orientation = 'row';
        row.alignChildren = ['left', 'center'];
        row.spacing = 12;
        row.alignment = 'fill';

        function addCell(width) {
            var cell = row.add('group');
            cell.orientation = 'column';
            cell.alignChildren = ['left', 'top'];
            cell.spacing = 4;
            cell.alignment = 'top';
            cell.preferredSize.width = width;
            cell.maximumSize.width = width;
            return cell;
        }
        var measCell = addCell(columnWidths.measurement);
        var easeColumnWidth = columnWidths.ease;
        if (config.noEaseColumn === true) easeColumnWidth = 0;
        var easeCell = addCell(easeColumnWidth);
        if (config.noEaseColumn === true) {
            try {
                easeCell.visible = false;
            } catch (eHideEase) {}
        }
        var consCell = addCell(columnWidths.construction);
        function prepareOptions(source, labelWidth) {
            var prepared = {};
            if (source) {
                for (var optKey in source) {
                    if (source.hasOwnProperty(optKey)) prepared[optKey] = source[optKey];
                }
            }
            if (labelWidth !== undefined && prepared.labelWidth === undefined) prepared.labelWidth = labelWidth;
            return prepared;
        }
        var measField = addFieldRow(measCell, config.label, config.defaultValue, prepareOptions(config.measOptions, columnLabelWidths.measurement));
        var easeField = null;
        if (config.noEaseColumn === true) {
            easeField = null;
        } else {
            easeField = addFieldRow(easeCell, config.easeLabel || config.label, config.easeDefault, prepareOptions(config.easeOptions, columnLabelWidths.ease));
        }
        var finalField = addFieldRow(consCell, config.finalLabel || config.label, config.finalDefault, prepareOptions(config.finalOptions, columnLabelWidths.construction));
        addDivider(rowWrapper);
        return {
            measField: measField,
            easeField: easeField,
            finalField: finalField,
            measCell: measCell,
            easeCell: easeCell,
            consCell: consCell
        };
    }
    var rowRefs = {};
    var secondaryRowRefs = {};
    var brwField = null;
    var wawField = null;
    var hiwField = null;
    var brgPlusField = null;
    var bShSField = null;
    var frontWaistDartAdditionField = null;
    var frontDartLengthField = null;
    var mainBackDartLengthField = null;
    var secondBackDartLengthField = null;
    var measurementSummaryCheckbox = null;
    var customShoulderAnglesCheckbox = null;
    var frontShoulderAngleField = null;
    var backShoulderAngleField = null;

    function createRowForDefinition(def) {
        var rawEaseNote = (def.id === 'BL') ? '- / +' : (FIT_PROFILES[defaults.FitIndex].notes[def.id] || '');
        var easeNote = normalizeNote(rawEaseNote);
        var easeLabel = def.easeLabel;
        if (!easeLabel) {
            if (def.id === 'BL') easeLabel = 'BL Balance';
            else if (def.id === 'ShG') easeLabel = 'ShG Ease';
            else easeLabel = def.label;
        }
        var easeDefault = def.hasOwnProperty('easeDefault') ? def.easeDefault : ((def.id === 'BL') ? defaults.BLBal : '');
        var easeOptions = {};
        if (def.easeOptions) {
            for (var easeKey in def.easeOptions) {
                if (def.easeOptions.hasOwnProperty(easeKey)) easeOptions[easeKey] = def.easeOptions[easeKey];
            }
        }
        if (easeNote && easeOptions.note === undefined) easeOptions.note = easeNote;
        var finalLabel = def.finalLabel;
        if (!finalLabel) {
            if (def.id === 'AhD') finalLabel = '1. AhD+';
            else if (def.id === 'BG') finalLabel = '5. BG+';
            else if (def.id === 'AG') finalLabel = '6. AG+';
            else if (def.id === 'ShG') finalLabel = '8. fShS';
            else if (def.id === 'BL') finalLabel = '9. BL (final)';
            else finalLabel = def.label;
        }
        var finalDefault = def.hasOwnProperty('finalDefault') ? def.finalDefault : '';
        var finalOptions = {
            enabled: false
        };
        if (def.finalOptions) {
            finalOptions = {};
            for (var finalKey in def.finalOptions) {
                if (def.finalOptions.hasOwnProperty(finalKey)) finalOptions[finalKey] = def.finalOptions[finalKey];
            }
        }
        var measOptions = {};
        if (def.measOptions) {
            for (var measKey in def.measOptions) {
                if (def.measOptions.hasOwnProperty(measKey)) measOptions[measKey] = def.measOptions[measKey];
            }
        }
        var row = addMeasurementRow({
            label: def.label,
            defaultValue: def.defaultValue,
            measOptions: measOptions,
            easeLabel: easeLabel,
            easeDefault: easeDefault,
            easeOptions: easeOptions,
            finalLabel: finalLabel,
            finalDefault: finalDefault,
            finalOptions: finalOptions,
            noEaseColumn: def.noEaseColumn === true
        });
        var labelNumberPrefix = '';
        if (typeof def.label === 'string') {
            var numberMatch = /^(\d+)\.\s*/.exec(def.label);
            if (numberMatch) labelNumberPrefix = numberMatch[1] + '. ';
        }
        if (def.id === 'BrC') {
            var brwLabel = labelNumberPrefix ? labelNumberPrefix + 'BrW' : 'BrW';
            brwField = addFieldRow(row.consCell, brwLabel, '', {
                enabled: false,
                labelWidth: columnLabelWidths.construction
            });
            try {
                row.finalField.parent.visible = false;
            } catch (eHideBrC) {}
            collapseGroup(row.finalField.parent);
            configureDerivedField(brwField, columnLabelWidths.construction);
        }
        if (def.id === 'WaC') {
            var wawLabel = labelNumberPrefix ? labelNumberPrefix + 'WaW' : 'WaW';
            wawField = addFieldRow(row.consCell, wawLabel, '', {
                enabled: false,
                labelWidth: columnLabelWidths.construction
            });
            try {
                row.finalField.parent.visible = false;
            } catch (eHideWaW) {}
            collapseGroup(row.finalField.parent);
            configureDerivedField(wawField, columnLabelWidths.construction);
        }
        if (def.id === 'HiC') {
            var hiwLabel = labelNumberPrefix ? labelNumberPrefix + 'HiW' : 'HiW';
            hiwField = addFieldRow(row.consCell, hiwLabel, '', {
                enabled: false,
                labelWidth: columnLabelWidths.construction
            });
            try {
                row.finalField.parent.visible = false;
            } catch (eHideHiW) {}
            collapseGroup(row.finalField.parent);
            configureDerivedField(hiwField, columnLabelWidths.construction);
        }
        if (def.id === 'BrG') {
            var brgPlusLabel = labelNumberPrefix ? labelNumberPrefix + 'BrG+' : 'BrG+';
            brgPlusField = addFieldRow(row.consCell, brgPlusLabel, '', {
                enabled: false,
                labelWidth: columnLabelWidths.construction
            });
            try {
                row.finalField.parent.visible = false;
            } catch (eHideBrG) {}
            collapseGroup(row.finalField.parent);
            configureDerivedField(brgPlusField, columnLabelWidths.construction);
        }
        if (def.id === 'ShG') {
            var bShSLabel = labelNumberPrefix ? labelNumberPrefix + 'bShS' : 'bShS';
            bShSField = addFieldRow(row.consCell, bShSLabel, '', {
                enabled: false,
                labelWidth: columnLabelWidths.construction
            });
            configureDerivedField(bShSField, columnLabelWidths.construction);
        }
        rowRefs[def.id] = row;
        return row;
    }
    for (var i = 0; i < MEASURE_ROWS.length; i++) {
        createRowForDefinition(MEASURE_ROWS[i]);
    }
    createRowForDefinition(BL_ROW_DEF);
    var flEaseNote = normalizeNote('- / +');
    var flLabel = FL_NUMBER + '. FL';
    var flFinalLabel = FL_NUMBER + '. FL (final)';
    var flRow = addMeasurementRow({
        label: flLabel,
        defaultValue: defaults.FL,
        easeLabel: 'FL Balance',
        easeDefault: 0,
        easeOptions: flEaseNote ? {
            note: flEaseNote
        } : {},
        finalLabel: flFinalLabel,
        finalDefault: '',
        finalOptions: {
            enabled: false
        }
    });
    rowRefs.FL = flRow;
    var flMeasureField = flRow.measField;
    var flBalanceField = flRow.easeField;
    var flFinalField = flRow.finalField;
    var optimalBalanceField = addFieldRow(flRow.consCell, 'Optimal Balance', defaults.OptimalBalance, {
        labelWidth: columnLabelWidths.construction
    });
    var individualBalanceField = addFieldRow(flRow.consCell, 'Individual Balance', '', {
        enabled: false,
        labelWidth: columnLabelWidths.construction
    });
    var finalBalanceField = addFieldRow(flRow.consCell, 'Final Balance', '', {
        enabled: false,
        labelWidth: columnLabelWidths.construction
    });
    for (var j = 0; j < SECONDARY_ROWS.length; j++) {
        var secondaryDef = SECONDARY_ROWS[j];
        secondaryRowRefs[secondaryDef.id] = createRowForDefinition(secondaryDef);
    }
    optionsPanel.orientation = 'column';
    optionsPanel.alignChildren = 'left';
    optionsPanel.margins = 10;
    optionsPanel.spacing = 6;
    optionsPanel.alignment = ['left', 'top'];
    measurementSummaryCheckbox = addFieldRow(optionsPanel, 'Show Measurement Summary', defaults.ShowMeasurementPalette === true, {
        type: 'checkbox',
        labelWidth: optionsLabelWidth,
        helpTip: 'Opens a palette listing measurement, ease, and final values instead of creating a reference artboard.'
    });
    var backContourLabelNumber = 16;
    var backContourField = addFieldRow(optionsPanel, backContourLabelNumber + '. Back Contour Cut-out', defaults.BackContour, {
        note: '2cm - 3cm',
        labelWidth: optionsLabelWidth,
        helpTip: 'page 157, number 7'
    });
    var backContourStoredValue = defaults.BackContour;
    var shoulderDiffLabelNumber = 17;
    var shoulderDifferenceField = addFieldRow(optionsPanel, shoulderDiffLabelNumber + '. Shoulder Difference (deg)', defaults.ShoulderDifference, {
        labelWidth: optionsLabelWidth,
        helpTip: 'page 159, number 24'
    });
    customShoulderAnglesCheckbox = addFieldRow(optionsPanel, 'Use Custom Front/Back Shoulder Angles', false, {
        type: 'checkbox',
        labelWidth: optionsLabelWidth,
        helpTip: 'Overrides ShA +/- Shoulder Difference'
    });
    var defaultFrontShoulderAngle = defaults.ShA + defaults.ShoulderDifference;
    var defaultBackShoulderAngle = defaults.ShA - defaults.ShoulderDifference;
    frontShoulderAngleField = addFieldRow(optionsPanel, 'Front Shoulder Angle (deg)', defaultFrontShoulderAngle, {
        labelWidth: optionsLabelWidth
    });
    backShoulderAngleField = addFieldRow(optionsPanel, 'Back Shoulder Angle (deg)', defaultBackShoulderAngle, {
        labelWidth: optionsLabelWidth
    });
    var backShoulderDartLabelNumber = 18;
    var backShoulderDartField = addFieldRow(optionsPanel, backShoulderDartLabelNumber + '. Back Shoulder Dart Intake', defaults.BackShoulderDartIntake, {
        labelWidth: optionsLabelWidth,
        helpTip: 'page 162, number 31'
    });
    var frontWaistDartAdditionLabelNumber = 19;
    var initialFrontWaistAddition = computeFrontWaistDartAdditionDefault(defaults.FitIndex);
    frontWaistDartAdditionField = addFieldRow(optionsPanel, frontWaistDartAdditionLabelNumber + '. Front Waist Dart Intake Addition (0-1cm)', initialFrontWaistAddition, {
        labelWidth: optionsLabelWidth,
        helpTip: 'see page 162, number 36'
    });
    if (shoulderDifferenceField && shoulderDifferenceField.parent && shoulderDifferenceField.parent.children && shoulderDifferenceField.parent.children.length > 0) {
        try {
            shoulderDifferenceField.parent.children[0].helpTip = 'page 159, number 24';
        } catch (eShoulderTip) {}
    }
    backContourField.helpTip = 'page 157, number 7';
    try {
        backContourField.parent.children[0].helpTip = 'page 157, number 7';
    } catch (eBackTip) {}
    if (backShoulderDartField && backShoulderDartField.parent && backShoulderDartField.parent.children && backShoulderDartField.parent.children.length > 0) {
        try {
            backShoulderDartField.parent.children[0].helpTip = 'page 162, number 31';
        } catch (eBackDartTip) {}
    }
    if (frontWaistDartAdditionField && frontWaistDartAdditionField.parent && frontWaistDartAdditionField.parent.children && frontWaistDartAdditionField.parent.children.length > 0) {
        try {
            frontWaistDartAdditionField.parent.children[0].helpTip = 'see page 162, number 36';
        } catch (eFrontWaistTip) {}
    }
    var frontDartLengthLabelNumber = 20;
    frontDartLengthField = addFieldRow(optionsPanel, frontDartLengthLabelNumber + '. Front Dart Length', defaults.FrontDartLength, {
        labelWidth: optionsLabelWidth,
        helpTip: 'Default 12 cm'
    });
    var mainBackDartLengthLabelNumber = 21;
    mainBackDartLengthField = addFieldRow(optionsPanel, mainBackDartLengthLabelNumber + '. Main Back Dart Length (14-16cm)', defaults.MainBackDartLength, {
        labelWidth: optionsLabelWidth,
        helpTip: 'Default 15 cm'
    });
    var secondBackDartLengthLabelNumber = 22;
    secondBackDartLengthField = addFieldRow(optionsPanel, secondBackDartLengthLabelNumber + '. Second Back Dart Length (12-14cm)', defaults.SecondBackDartLength, {
        labelWidth: optionsLabelWidth,
        helpTip: 'Default 13 cm'
    });
    var backContourCheckbox = optionsPanel.add('checkbox', undefined, 'Hollow Back Curve / Flat Buttocks');
    backContourCheckbox.helpTip = 'page 157, number 8. An average of the 2-3cm (2.7cm is used)';
    backContourCheckbox.alignment = 'left';

    function setCustomShoulderAngleFieldsEnabled(enabled) {
        if (frontShoulderAngleField) {
            try {
                frontShoulderAngleField.enabled = !!enabled;
            } catch (eFrontAngleEnable) {}
        }
        if (backShoulderAngleField) {
            try {
                backShoulderAngleField.enabled = !!enabled;
            } catch (eBackAngleEnable) {}
        }
    }
    setCustomShoulderAngleFieldsEnabled(false);

    function parseField(field, fallback) {
        var v = parseFloat(field.text);
        return isNaN(v) ? fallback : v;
    }

    function formatValue(val) {
        return (Math.round(val * 100) / 100).toFixed(2);
    }

    function trimString(str) {
        if (str === undefined || str === null) return '';
        return String(str).replace(/^\s+|\s+$/g, '');
    }

    function normalizeNote(note) {
        if (note === undefined || note === null) return '';
        var clean = String(note);
        clean = clean.replace(/\u2012|\u2013|\u2014|\u2015|\u2212/g, '-');
        clean = clean.replace(/\s*-\s*/g, ' - ');
        clean = clean.replace(/\s+/g, ' ');
        clean = clean.replace(/\s+cm/gi, ' cm');
        return clean.replace(/^\s+|\s+$/g, '');
    }

    function renumberLabel(text, number) {
        if (!text || typeof text !== 'string') return text;
        var remainder = text.replace(/^\d+\.\s*/, '');
        return number + '. ' + remainder;
    }

    function calculateRecommendedOptimalBalance(brc) {
        if (isNaN(brc)) return null;
        if (brc < 80) return 3.5;
        if (brc <= 89) return 3.5;
        if (brc <= 99) return 4;
        if (brc <= 109) return ((brc - 100) / 10) + 4.5;
        if (brc <= 119) return ((brc - 100) / 10) + 5;
        if (brc <= 129) return ((brc - 100) / 10) + 5.5;
        if (brc <= 150) return ((brc - 100) / 10) + 6;
        return ((brc - 100) / 10) + 6;
    }

    function ensureBackContourValue() {
        if (!backContourCheckbox || !backContourCheckbox.value) return;
        var raw = trimString(backContourField.text);
        var parsed = parseFloat(raw);
        var isDefault = !isNaN(parsed) && Math.abs(parsed - defaults.BackContour) < 0.0001;
        if (raw === '' || isNaN(parsed) || isDefault) {
            backContourField.text = formatValue(2.75);
        }
    }

    function updateConstruction() {
        for (var key in rowRefs) {
            if (!rowRefs.hasOwnProperty(key)) continue;
            var ref = rowRefs[key];
            var meas = parseField(ref.measField, 0);
            var ease = (ref.easeField) ? parseField(ref.easeField, 0) : 0;
            ref.finalField.text = formatValue(meas + ease);
        }
        var brMeasure = parseField(rowRefs['BrC'].measField, defaults.BrC);
        var brFinal = parseField(rowRefs['BrC'].finalField, defaults.BrC);
        var waFinal = parseField(rowRefs['WaC'].finalField, defaults.WaC);
        var hiFinal = parseField(rowRefs['HiC'].finalField, defaults.HiC);
        var shA = parseField(rowRefs['ShA'].measField, defaults.ShA);
        var shoulderDifference = parseField(shoulderDifferenceField, defaults.ShoulderDifference);
        var frontShoulderAngle = shA + shoulderDifference;
        var backShoulderAngle = shA - shoulderDifference;
        var useCustomShoulderAngles = customShoulderAnglesCheckbox && customShoulderAnglesCheckbox.value;
        if (useCustomShoulderAngles) {
            if (frontShoulderAngleField) {
                frontShoulderAngle = parseField(frontShoulderAngleField, frontShoulderAngle);
            }
            if (backShoulderAngleField) {
                backShoulderAngle = parseField(backShoulderAngleField, backShoulderAngle);
            }
        } else {
            if (frontShoulderAngleField) frontShoulderAngleField.text = formatValue(frontShoulderAngle);
            if (backShoulderAngleField) backShoulderAngleField.text = formatValue(backShoulderAngle);
        }
        var brw = brFinal / 2;
        var waw = waFinal / 2;
        var hiw = hiFinal / 2;
        var brgPlus = parseField(rowRefs['BrG'].finalField, defaults.BrG);
        var fShS = parseField(rowRefs['ShG'].finalField, defaults.ShG);
        var bShS = fShS + defaults.BackShoulderEase;
        var flMeasure = parseField(rowRefs['FL'].measField || flMeasureField, defaults.FL);
        var flBalance = parseField(flBalanceField, 0);
        var flFinal = flMeasure + flBalance;
        var BLMeas = parseField(rowRefs['BL'].measField, defaults.BL);
        var BLBal = rowRefs['BL'].easeField ? parseField(rowRefs['BL'].easeField, defaults.BLBal) : 0;
        var BLFinal = parseField(rowRefs['BL'].finalField, BLMeas + BLBal);
        var individualBalance = flMeasure - BLMeas;
        var recommendedOptimal = calculateRecommendedOptimalBalance(brMeasure);
        if (recommendedOptimal !== null) {
            var recommendedOptimalText = formatValue(recommendedOptimal);
            var currentOptimalText = trimString(optimalBalanceField.text);
            if (currentOptimalText === '' || currentOptimalText === lastRecommendedOptimalBalanceText || lastRecommendedOptimalBalanceText === null) {
                optimalBalanceField.text = recommendedOptimalText;
                currentOptimalText = recommendedOptimalText;
            }
            lastRecommendedOptimalBalanceText = recommendedOptimalText;
        } else {
            lastRecommendedOptimalBalanceText = null;
        }
        var optimalBalance = parseField(optimalBalanceField, defaults.OptimalBalance);
        var finalBalance = flFinal - BLFinal;
        var balanceDelta = Math.abs(finalBalance - optimalBalance);
        var balanceWithinTolerance = balanceDelta <= 1;
        if (brwField) brwField.text = formatValue(brw);
        if (wawField) wawField.text = formatValue(waw);
        if (hiwField) hiwField.text = formatValue(hiw);
        if (brgPlusField) brgPlusField.text = formatValue(brgPlus);
        if (bShSField) bShSField.text = formatValue(bShS);
        flFinalField.text = formatValue(flFinal);
        individualBalanceField.text = formatValue(individualBalance);
        finalBalanceField.text = formatValue(finalBalance);
        latestDerived = {
            brw: brw,
            waw: waw,
            hiw: hiw,
            brgPlus: brgPlus,
            fShS: fShS,
            bShS: bShS,
            flMeasure: flMeasure,
            flBalance: flBalance,
            flFinal: flFinal,
            blMeasure: BLMeas,
            blBalance: BLBal,
            blFinal: BLFinal,
            individualBalance: individualBalance,
            optimalBalance: optimalBalance,
            finalBalance: finalBalance,
            balanceWithinTolerance: balanceWithinTolerance,
            balanceDelta: balanceDelta,
            shA: shA,
            shoulderDifference: shoulderDifference,
            frontShoulderAngle: frontShoulderAngle,
            backShoulderAngle: backShoulderAngle,
            frontShoulderDartRotation: frontShoulderDartRotation
        };
    }

    function updateEaseFromFit() {
        var idx = fitDropdown.selection ? fitDropdown.selection.index : defaults.FitIndex;
        if (idx < 0 || idx >= FIT_PROFILES.length) idx = defaults.FitIndex;
        var profile = FIT_PROFILES[idx];
        for (var key in rowRefs) {
            if (!rowRefs.hasOwnProperty(key)) continue;
            if (!profile.ease.hasOwnProperty(key)) continue;
            if (!rowRefs[key].easeField) continue;
            var easeVal = profile.ease[key];
            if (easeVal === undefined) easeVal = 0;
            rowRefs[key].easeField.text = formatValue(easeVal);
            var noteStr = profile.notes[key] || '';
            var st = rowRefs[key].easeField.parent.children[0];
            if (st && st.text !== undefined) {
                var labelText = String(st.text);
                var colonIdx = labelText.indexOf(':');
                var beforeColon = colonIdx >= 0 ? labelText.substring(0, colonIdx) : labelText;
                var parenIdx = beforeColon.indexOf('(');
                if (parenIdx >= 0) beforeColon = beforeColon.substring(0, parenIdx);
                var cleanBase = trimString(beforeColon);
                st.text = cleanBase + (noteStr ? ' (' + noteStr + '):' : ':');
            }
        }
        var frontWaistDefault = computeFrontWaistDartAdditionDefault(idx);
        if (frontWaistDartAdditionField) {
            frontWaistDartAdditionField.text = formatValue(frontWaistDefault);
        }
        updateConstruction();
    }
    for (var keyInit in rowRefs) {
        if (!rowRefs.hasOwnProperty(keyInit)) continue;
        rowRefs[keyInit].measField.onChanging = updateConstruction;
        if (rowRefs[keyInit].easeField) rowRefs[keyInit].easeField.onChanging = updateConstruction;
    }
    for (var keyInitSecondary in secondaryRowRefs) {
        if (!secondaryRowRefs.hasOwnProperty(keyInitSecondary)) continue;
        var secondaryRef = secondaryRowRefs[keyInitSecondary];
        secondaryRef.measField.onChanging = updateConstruction;
    if (secondaryRef.easeField) secondaryRef.easeField.onChanging = updateConstruction;
    }
    shoulderDifferenceField.onChanging = updateConstruction;
    if (customShoulderAnglesCheckbox) {
        customShoulderAnglesCheckbox.onClick = function() {
            setCustomShoulderAngleFieldsEnabled(customShoulderAnglesCheckbox.value);
            updateConstruction();
        };
    }
    if (frontShoulderAngleField) frontShoulderAngleField.onChanging = updateConstruction;
    if (backShoulderAngleField) backShoulderAngleField.onChanging = updateConstruction;
    if (backShoulderDartField) backShoulderDartField.onChanging = updateConstruction;
    if (frontWaistDartAdditionField) frontWaistDartAdditionField.onChanging = updateConstruction;
    if (frontDartLengthField) frontDartLengthField.onChanging = updateConstruction;
    if (mainBackDartLengthField) mainBackDartLengthField.onChanging = updateConstruction;
    if (secondBackDartLengthField) secondBackDartLengthField.onChanging = updateConstruction;
    backContourField.onChanging = function() {
        if (!backContourCheckbox.value) {
            var parsed = parseFloat(backContourField.text);
            if (!isNaN(parsed)) backContourStoredValue = parsed;
        }
        updateConstruction();
    };
    backContourCheckbox.onClick = function() {
        if (backContourCheckbox.value) {
            var current = parseFloat(backContourField.text);
            if (!isNaN(current)) backContourStoredValue = current;
            ensureBackContourValue();
        } else {
            var restoreValue = backContourStoredValue;
            if (isNaN(restoreValue)) restoreValue = defaults.BackContour;
            backContourField.text = formatValue(restoreValue);
        }
        updateConstruction();
    };
    fitDropdown.onChange = updateEaseFromFit;
    var buttonRow = dlg.add('group');
    buttonRow.alignment = 'right';
    buttonRow.add('button', undefined, 'OK', {
        name: 'ok'
    });
    buttonRow.add('button', undefined, 'Cancel', {
        name: 'cancel'
    });
    updateEaseFromFit();
    if (dlg.show() !== 1) return;
    var selectedProfile = FIT_PROFILES[fitDropdown.selection ? fitDropdown.selection.index : defaults.FitIndex];
    var shouldShowMeasurementPalette = measurementSummaryCheckbox && measurementSummaryCheckbox.value === true;
    var measurementResults = {};
    var easeResults = {};
    var finalResults = {};
    for (var keyRes in rowRefs) {
        if (!rowRefs.hasOwnProperty(keyRes)) continue;
        measurementResults[keyRes] = parseField(rowRefs[keyRes].measField, 0);
        var easeField = rowRefs[keyRes].easeField;
        easeResults[keyRes] = easeField ? parseField(easeField, 0) : 0;
        finalResults[keyRes] = parseField(rowRefs[keyRes].finalField, 0);
    }
    for (var keyResSecondary in secondaryRowRefs) {
        if (!secondaryRowRefs.hasOwnProperty(keyResSecondary)) continue;
        var secRefRes = secondaryRowRefs[keyResSecondary];
        measurementResults[keyResSecondary] = parseField(secRefRes.measField, 0);
        var secEaseField = secRefRes.easeField;
        easeResults[keyResSecondary] = secEaseField ? parseField(secEaseField, 0) : 0;
        finalResults[keyResSecondary] = parseField(secRefRes.finalField, 0);
    }
    var shoulderDifferenceValue = parseField(shoulderDifferenceField, defaults.ShoulderDifference);
    measurementResults.ShoulderDifference = shoulderDifferenceValue;
    easeResults.ShoulderDifference = 0;
    finalResults.ShoulderDifference = shoulderDifferenceValue;
    ensureBackContourValue();
    var backContourAuto = backContourCheckbox.value === true;
    var BackContour = parseField(backContourField, defaults.BackContour);
    if (BackContour <= 0) BackContour = defaults.BackContour;
    measurementResults.BackContour = BackContour;
    easeResults.BackContour = 0;
    finalResults.BackContour = BackContour;
    var backShoulderDartIntake = parseField(backShoulderDartField, defaults.BackShoulderDartIntake);
    if (isNaN(backShoulderDartIntake) || backShoulderDartIntake <= 0) backShoulderDartIntake = defaults.BackShoulderDartIntake;
    measurementResults.BackShoulderDartIntake = backShoulderDartIntake;
    easeResults.BackShoulderDartIntake = 0;
    finalResults.BackShoulderDartIntake = backShoulderDartIntake;
    var selectedFitIndex = fitDropdown.selection ? fitDropdown.selection.index : defaults.FitIndex;
    var frontWaistDefault = computeFrontWaistDartAdditionDefault(selectedFitIndex);
    var frontWaistDartAddition = parseField(frontWaistDartAdditionField, frontWaistDefault);
    if (isNaN(frontWaistDartAddition)) frontWaistDartAddition = defaults.FrontWaistDartAddition;
    if (frontWaistDartAddition < 0) frontWaistDartAddition = 0;
    if (frontWaistDartAddition > 1) frontWaistDartAddition = 1;
    measurementResults.FrontWaistDartAddition = frontWaistDartAddition;
    easeResults.FrontWaistDartAddition = 0;
    finalResults.FrontWaistDartAddition = frontWaistDartAddition;
    var parsedFrontDartLength = parseField(frontDartLengthField, defaults.FrontDartLength);
    if (isNaN(parsedFrontDartLength) || parsedFrontDartLength < 0) parsedFrontDartLength = defaults.FrontDartLength;
    frontDartLengthValue = parsedFrontDartLength;
    measurementResults.FrontDartLength = parsedFrontDartLength;
    easeResults.FrontDartLength = 0;
    finalResults.FrontDartLength = parsedFrontDartLength;
    var parsedMainBackDartLength = parseField(mainBackDartLengthField, defaults.MainBackDartLength);
    if (isNaN(parsedMainBackDartLength)) parsedMainBackDartLength = defaults.MainBackDartLength;
    if (parsedMainBackDartLength < 14) parsedMainBackDartLength = 14;
    if (parsedMainBackDartLength > 16) parsedMainBackDartLength = 16;
    mainBackDartLengthValue = parsedMainBackDartLength;
    measurementResults.MainBackDartLength = parsedMainBackDartLength;
    easeResults.MainBackDartLength = 0;
    finalResults.MainBackDartLength = parsedMainBackDartLength;
    var parsedSecondBackDartLength = parseField(secondBackDartLengthField, defaults.SecondBackDartLength);
    if (isNaN(parsedSecondBackDartLength)) parsedSecondBackDartLength = defaults.SecondBackDartLength;
    if (parsedSecondBackDartLength < 12) parsedSecondBackDartLength = 12;
    if (parsedSecondBackDartLength > 14) parsedSecondBackDartLength = 14;
    secondBackDartLengthValue = parsedSecondBackDartLength;
    measurementResults.SecondBackDartLength = parsedSecondBackDartLength;
    easeResults.SecondBackDartLength = 0;
    finalResults.SecondBackDartLength = parsedSecondBackDartLength;
    var NeG = parseField(secondaryRowRefs['NeG'].measField, defaults.NeG);
    var MoL = parseField(secondaryRowRefs['MoL'].measField, defaults.MoL);
    var BL = parseField(rowRefs['BL'].measField, defaults.BL);
    var BLBal = parseField(rowRefs['BL'].easeField, defaults.BLBal);
    var BLFinal = parseField(rowRefs['BL'].finalField, BL + BLBal);
    var HiD = parseField(secondaryRowRefs['HiD'].measField, defaults.HiD);
    var AhDPlus = finalResults['AhD'];
    var ShA = parseField(secondaryRowRefs['ShA'].measField, defaults.ShA);
    var fShSValue = parseField(rowRefs['ShG'].finalField, defaults.ShG);
    var shoulderDifference = shoulderDifferenceValue;
    var frontShoulderAngle = ShA + shoulderDifference;
    var backShoulderAngle = ShA - shoulderDifference;
    var useCustomShoulderAngles = customShoulderAnglesCheckbox && customShoulderAnglesCheckbox.value;
    if (useCustomShoulderAngles) {
        if (frontShoulderAngleField) {
            frontShoulderAngle = parseField(frontShoulderAngleField, frontShoulderAngle);
        }
        if (backShoulderAngleField) {
            backShoulderAngle = parseField(backShoulderAngleField, backShoulderAngle);
        }
    }
    var bShS = fShSValue + defaults.BackShoulderEase;

    function makeRGB(r, g, b) {
        var c = new RGBColor();
        c.red = r;
        c.green = g;
        c.blue = b;
        return c;
    }

    function norm(name) {
        return (name && name.toString) ? name.toString().replace(/^\s+|\s+$/g, '').toLowerCase() : '';
    }

    function removeLayerIfNamed(target) {
        var goal = norm(target);
        for (var i = doc.layers.length - 1; i >= 0; i--) {
            var layer = doc.layers[i];
            if (norm(layer.name) === goal) {
                try {
                    layer.locked = false;
                } catch (e1) {}
                try {
                    layer.visible = true;
                } catch (e2) {}
                try {
                    layer.remove();
                } catch (e3) {}
            }
        }
    }
    removeLayerIfNamed('Layer 1');
    removeLayerIfNamed('layer');
    removeLayerIfNamed('<layer>');
    removeLayerIfNamed('&lt;layer&gt;');

    function ensureArtboardSize(widthCm, heightCm) {
        var idx = doc.artboards.getActiveArtboardIndex();
        var ab = doc.artboards[idx];
        var rect = ab.artboardRect;
        var desiredW = cm(widthCm);
        var desiredH = cm(heightCm);
        var currentW = rect[2] - rect[0];
        var currentH = rect[1] - rect[3];
        if (Math.abs(currentW - desiredW) > 0.5 || Math.abs(currentH - desiredH) > 0.5) {
            ab.artboardRect = [rect[0], rect[1], rect[0] + desiredW, rect[1] - desiredH];
        }
        return ab.artboardRect;
    }
    var artboardRect = ensureArtboardSize(100, 100);
    var originX = artboardRect[0] + cm(30);
    var originY = artboardRect[1] - cm(30);

    function normalizePoint(pt) {
        var x = 0,
            y = 0;
        if (pt != null) {
            if (typeof pt.x === 'number') x = pt.x;
            else if (typeof pt.length === 'number' && pt.length > 0 && typeof pt[0] === 'number') x = pt[0];
            if (typeof pt.y === 'number') y = pt.y;
            else if (typeof pt.length === 'number' && pt.length > 1 && typeof pt[1] === 'number') y = pt[1];
        }
        if (isNaN(x)) x = 0;
        if (isNaN(y)) y = 0;
        return [x, y];
    }

    function toArt(pt) {
        var coords = normalizePoint(pt);
        return [originX + cm(coords[0]), originY - cm(coords[1])];
    }

    function fromArt(pt) {
        if (!pt || pt.length < 2) return {
            x: 0,
            y: 0
        };
        var scale = cm(1);
        return {
            x: (pt[0] - originX) / scale,
            y: (originY - pt[1]) / scale
        };
    }

    function findLayerByName(name) {
        var goal = norm(name);
        for (var i = 0; i < doc.layers.length; i++) {
            if (norm(doc.layers[i].name) === goal) return doc.layers[i];
        }
        return null;
    }

    function ensureLayer(name) {
        var layer = findLayerByName(name);
        if (layer) return layer;
        layer = doc.layers.add();
        layer.name = name;
        return layer;
    }

    function ensureSubLayer(parentLayer, name) {
        if (!parentLayer || !parentLayer.layers) return null;
        var goal = norm(name);
        for (var i = 0; i < parentLayer.layers.length; i++) {
            var subLayer = parentLayer.layers[i];
            if (norm(subLayer.name) === goal) return subLayer;
        }
        var newLayer = parentLayer.layers.add();
        newLayer.name = name;
        return newLayer;
    }

    function findSubLayer(parentLayer, name) {
        if (!parentLayer || !parentLayer.layers) return null;
        var goal = norm(name);
        for (var i = 0; i < parentLayer.layers.length; i++) {
            var child = parentLayer.layers[i];
            if (norm(child.name) === goal) return child;
        }
        return null;
    }

    function movePageItemsToLayer(sourceLayer, targetLayer) {
        if (!sourceLayer || !targetLayer) return;
        if (sourceLayer === targetLayer) return;
        try {
            sourceLayer.locked = false;
        } catch (eUnlockSource) {}
        try {
            sourceLayer.visible = true;
        } catch (eShowSource) {}
        try {
            targetLayer.locked = false;
        } catch (eUnlockTarget) {}
        try {
            targetLayer.visible = true;
        } catch (eShowTarget) {}
        try {
            var items = sourceLayer.pageItems;
            for (var i = items.length - 1; i >= 0; i--) {
                var item = items[i];
                if (!item) continue;
                try {
                    item.move(targetLayer, ElementPlacement.PLACEATEND);
                } catch (eMoveItem) {
                    try {
                        item.layer = targetLayer;
                    } catch (eAssignLayer) {}
                }
            }
        } catch (eIterSourceItems) {}
        try {
            var childLayers = sourceLayer.layers;
            for (var j = childLayers.length - 1; j >= 0; j--) {
                var childLayer = childLayers[j];
                if (!childLayer) continue;
                movePageItemsToLayer(childLayer, targetLayer);
                try {
                    childLayer.remove();
                } catch (eRemoveChildLayer) {}
            }
        } catch (eSourceLayers) {}
    }

    function clearLayerDeep(layer) {
        if (!layer) return;
        try {
            var items = layer.pageItems;
            for (var i = items.length - 1; i >= 0; i--) {
                try {
                    items[i].remove();
                } catch (eLayerItem) {}
            }
        } catch (eLayerPage) {}
        try {
            if (layer.compoundPathItems) layer.compoundPathItems.removeAll();
        } catch (eLayerCompound) {}
        try {
            if (layer.pathItems) layer.pathItems.removeAll();
        } catch (eLayerPaths) {}
        try {
            if (layer.textFrames) layer.textFrames.removeAll();
        } catch (eLayerText) {}
        try {
            if (layer.groupItems) layer.groupItems.removeAll();
        } catch (eLayerGroups) {}
    }

    function resetGroup(parent, name) {
        if (!parent) return null;
        var groups = parent.groupItems;
        for (var i = groups.length - 1; i >= 0; i--) {
            if (groups[i].name === name) {
                try {
                    groups[i].remove();
                } catch (eRem) {}
            }
        }
        var group = parent.groupItems.add();
        group.name = name;
        return group;
    }

    function removeGroupsByName(parent, names) {
        if (!parent || !names || !names.length) return;
        try {
            var groups = parent.groupItems;
            for (var i = groups.length - 1; i >= 0; i--) {
                var grp = groups[i];
                if (!grp) continue;
                for (var n = 0; n < names.length; n++) {
                    if (grp.name === names[n]) {
                        try {
                            grp.remove();
                        } catch (eRemGroup) {}
                        break;
                    }
                }
            }
        } catch (eParentGroups) {}
    }

    function clearGroupDeep(group) {
        if (!group) return;
        try {
            for (var i = group.pageItems.length - 1; i >= 0; i--) {
                try {
                    group.pageItems[i].remove();
                } catch (ePI) {}
            }
        } catch (ePage) {}
        try {
            if (group.compoundPathItems) group.compoundPathItems.removeAll();
        } catch (eCP) {}
        try {
            if (group.pathItems) group.pathItems.removeAll();
        } catch (ePath) {}
        try {
            if (group.textFrames) group.textFrames.removeAll();
        } catch (eText) {}
        try {
            if (group.groupItems) group.groupItems.removeAll();
        } catch (eGroup) {}
    }
    var basicFrameLayer = ensureLayer('Basic Frame');
    try {
        basicFrameLayer.locked = false;
    } catch (eBF1) {}
    try {
        basicFrameLayer.visible = true;
    } catch (eBF2) {}
    var legacyBasicLines = findSubLayer(basicFrameLayer, 'Lines');
    if (legacyBasicLines) {
        movePageItemsToLayer(legacyBasicLines, basicFrameLayer);
        try {
            legacyBasicLines.remove();
        } catch (eRemoveBasicLines) {}
    }
    try {
        basicFrameLayer.color = LAYER_COLOR;
    } catch (eColor) {}
    var labelsLayer = ensureLayer('Labels & Markers');
    try {
        labelsLayer.locked = false;
    } catch (eLbl1) {}
    try {
        labelsLayer.visible = true;
    } catch (eLbl2) {}
    var dartsLayer = ensureLayer('Darts & Shaping');
    try {
        dartsLayer.locked = false;
    } catch (eDartsLock) {}
    try {
        dartsLayer.visible = true;
    } catch (eDartsVis) {}
    var dartsSubLayer = ensureSubLayer(dartsLayer, 'Darts');
    var shapingLayer = ensureSubLayer(dartsLayer, 'Shaping');
    if (dartsSubLayer) {
        try {
            dartsSubLayer.locked = false;
        } catch (eDartsSubLock) {}
        try {
            dartsSubLayer.visible = true;
        } catch (eDartsSubVis) {}
    }
    if (shapingLayer) {
        try {
            shapingLayer.locked = false;
        } catch (eShapingLock) {}
        try {
            shapingLayer.visible = true;
        } catch (eShapingVis) {}
    }
    var armholeLayer = ensureLayer('Armhole Curves');
    try {
        armholeLayer.locked = false;
    } catch (eArmLock) {}
    try {
        armholeLayer.visible = false;
    } catch (eArmVis) {}
    var measurementLayer = ensureLayer('Measurement Reference');
    try {
        measurementLayer.locked = false;
    } catch (eMeasLock) {}
    try {
        measurementLayer.visible = true;
    } catch (eMeasVis) {}
    for (var iLayer = doc.layers.length - 1; iLayer >= 0; iLayer--) {
        var lyr = doc.layers[iLayer];
        var nameNorm = norm(lyr.name);
        if (nameNorm !== norm('Basic Frame') && nameNorm !== norm('Labels & Markers') && nameNorm !== norm('Darts & Shaping') && nameNorm !== norm('Armhole Curves') && nameNorm !== norm('Measurement Reference')) {
            try {
                lyr.locked = false;
            } catch (eLk) {}
            try {
                lyr.visible = true;
            } catch (eVs) {}
            try {
                lyr.remove();
            } catch (eRm) {}
        }
    }
    basicFrameLayer = ensureLayer('Basic Frame');
    legacyBasicLines = findSubLayer(basicFrameLayer, 'Lines');
    if (legacyBasicLines) {
        movePageItemsToLayer(legacyBasicLines, basicFrameLayer);
        try {
            legacyBasicLines.remove();
        } catch (eRemoveBasicLines2) {}
    }
    labelsLayer = ensureLayer('Labels & Markers');
    dartsLayer = ensureLayer('Darts & Shaping');
    dartsSubLayer = ensureSubLayer(dartsLayer, 'Darts');
    var targetDartsContainer = dartsSubLayer || dartsLayer;
    var legacyLinesLayer = null;
    if (dartsSubLayer) legacyLinesLayer = findSubLayer(dartsSubLayer, 'Lines');
    if (!legacyLinesLayer && dartsLayer) legacyLinesLayer = findSubLayer(dartsLayer, 'Lines');
    if (legacyLinesLayer && targetDartsContainer) {
        movePageItemsToLayer(legacyLinesLayer, targetDartsContainer);
        try {
            legacyLinesLayer.remove();
        } catch (eRemoveLegacyLines) {}
    }
    shapingLayer = ensureSubLayer(dartsLayer, 'Shaping');
    armholeLayer = ensureLayer('Armhole Curves');
    measurementLayer = ensureLayer('Measurement Reference');
clearLayerDeep(basicFrameLayer);
var linesGroup = basicFrameLayer;
var markersGroup = resetGroup(labelsLayer, 'Markers');
    var numbersGroup = resetGroup(labelsLayer, 'Numbers');
    var labelsGroup = resetGroup(labelsLayer, 'Labels');
    clearGroupDeep(markersGroup);
    clearGroupDeep(numbersGroup);
    clearGroupDeep(labelsGroup);
var dartsLinesGroup = null;
if (dartsSubLayer) {
    clearLayerDeep(dartsSubLayer);
    removeGroupsByName(dartsSubLayer, ['Lines']);
    dartsLinesGroup = dartsSubLayer;
} else {
    clearLayerDeep(dartsLayer);
    removeGroupsByName(dartsLayer, ['Lines']);
    dartsLinesGroup = dartsLayer;
}
    if (shapingLayer) clearLayerDeep(shapingLayer);
    try {
        basicFrameLayer.zOrder(ZOrderMethod.SENDTOBACK);
    } catch (eOrderBasic) {}
    if (armholeLayer) {
        try {
            armholeLayer.zOrder(ZOrderMethod.BRINGTOFRONT);
        } catch (eOrderArm) {}
    }
    try {
        labelsLayer.zOrder(ZOrderMethod.BRINGTOFRONT);
    } catch (eOrderLabels) {}
    try {
        dartsLayer.zOrder(ZOrderMethod.BRINGTOFRONT);
    } catch (eOrderDarts) {}
    if (measurementLayer) {
        try {
            measurementLayer.zOrder(ZOrderMethod.BRINGTOFRONT);
        } catch (eOrderMeasurement) {}
    }
    var FRAME_COLOR = makeRGB(0, 0, 0);
    var NUMBER_FILL_COLOR = makeRGB(255, 255, 255);
    var LABEL_FONT_SIZE_PT = 13;
    var NUMBER_FONT_SIZE_PT = 9;
    var MARKER_RADIUS_CM = 0.25;
    var FRAME_LINE_LENGTH_CM = 40;
    var LABEL_RIGHT_OFFSET_CM = 5;
    var LABEL_VERTICAL_OFFSET_CM = 0.5;
    var LINE_LABEL_HORIZONTAL_SHIFT_CM = ptToCm(200);
    var CONNECTOR_BLUE_COLOR = makeRGB(0, 0, 0);
    var LAYER_COLOR = makeRGB(0, 0, 0);
    var DART_TRIANGLE_COLOR = makeRGB(255, 0, 0);
    var HIP_LEFT_OFFSET_CM = 2;
    var DASH_PATTERN = [25, 12];
    var LABEL_SMALL_OFFSET_CM = 0.5;
    var FRONT_ARM_LABEL_NORMAL_OFFSET_CM = -0.5;
    var MIN_HANDLE_LENGTH_CM = 0.5;
    var FRONT_ARMHOLE_START_HANDLE_CM = 11.92;
    var FRONT_ARMHOLE_END_HANDLE_CM = 4.6;
    var REFERENCE_TABLE_MARGIN_CM = 5;
    var REFERENCE_TABLE_ROW_HEIGHT_CM = 1.3;
    var REFERENCE_TABLE_COL_OFFSETS_CM = [0, 6, 13, 18];
    var REFERENCE_TABLE_TOTAL_WIDTH_CM = 20;
    var REFERENCE_TITLE_FONT_SIZE_PT = 17;
    var REFERENCE_HEADER_FONT_SIZE_PT = 15;
    var REFERENCE_BODY_FONT_SIZE_PT = 13;
    var labelAlignmentRefs = {};

    function drawFrameLine(pA, pB, name, color, targetGroup) {
        var strokeColor = color || FRAME_COLOR;
        var container = targetGroup;
        if (!container) {
            if (strokeColor === DART_TRIANGLE_COLOR && dartsLinesGroup) {
                container = dartsLinesGroup;
            } else {
                container = linesGroup;
            }
        }
        if (!container) return null;
        var path = null;
        if (name) {
            try {
                var existing = container.pathItems;
                for (var idx = existing.length - 1; idx >= 0; idx--) {
                    var candidate = existing[idx];
                    if (!candidate) continue;
                    var candidateName = '';
                    try {
                        candidateName = candidate.name;
                    } catch (eNameRead) {}
                    if (candidateName === name) {
                        if (!path) {
                            path = candidate;
                        } else {
                            try {
                                candidate.remove();
                            } catch (eDupRem) {}
                        }
                    }
                }
            } catch (eExisting) {}
        }
        if (!path) {
            path = container.pathItems.add();
            if (name) {
                try {
                    path.name = name;
                } catch (eNameAssign) {}
            }
        }
        path.setEntirePath([toArt(pA), toArt(pB)]);
        path.stroked = true;
        path.strokeWidth = 1;
        path.strokeColor = strokeColor;
        path.filled = false;
        return path;
    }

    function drawCurveBetween(pA, pB, options) {
        options = options || {};
        var color = options.color || FRAME_COLOR;
        var name = options.name;
        var bulgeCm = options.bulgeCm;
        if (bulgeCm === undefined || bulgeCm === null || isNaN(bulgeCm)) bulgeCm = 1;
        var startArt = toArt(pA);
        var endArt = toArt(pB);
        var path = linesGroup.pathItems.add();
        path.setEntirePath([startArt, endArt]);
        path.stroked = true;
        path.strokeWidth = 1;
        path.strokeColor = color;
        path.filled = false;
        try {
            path.closed = false;
        } catch (eClosed) {}
        var startPoint = path.pathPoints[0];
        var endPoint = path.pathPoints[1];
        var dx = endArt[0] - startArt[0];
        var dy = endArt[1] - startArt[1];
        var len = Math.sqrt((dx * dx) + (dy * dy));
        var nx = 0;
        var ny = 0;
        if (len > 0) {
            nx = -dy / len;
            ny = dx / len;
        }
        var bulge = cm(bulgeCm);
        var flattenStart = options.flattenStart === true;
        var flattenEnd = options.flattenEnd === true;
        startPoint.pointType = flattenStart ? PointType.CORNER : PointType.SMOOTH;
        endPoint.pointType = flattenEnd ? PointType.CORNER : PointType.SMOOTH;
        startPoint.leftDirection = startPoint.anchor;
        endPoint.rightDirection = endPoint.anchor;
        if (flattenStart) {
            startPoint.rightDirection = startPoint.anchor;
        } else {
            startPoint.rightDirection = [startArt[0] + (dx / 3) + (nx * bulge), startArt[1] + (dy / 3) + (ny * bulge)];
        }
        if (flattenEnd) {
            endPoint.leftDirection = endPoint.anchor;
        } else {
            endPoint.leftDirection = [endArt[0] - (dx / 3) + (nx * bulge), endArt[1] - (dy / 3) + (ny * bulge)];
        }
        if (name) {
            try {
                path.name = name;
            } catch (eCurveName) {}
        }
        return path;
    }

    function drawBezierCurve(pStart, pEnd, control1, control2, options) {
        options = options || {};
        var container = options.targetGroup || linesGroup;
        if (!container) return null;
        var startAnchor = toArt(pStart);
        var endAnchor = toArt(pEnd);
        var control1Anchor = control1 ? toArt(control1) : startAnchor;
        var control2Anchor = control2 ? toArt(control2) : endAnchor;
        var path = container.pathItems.add();
        try {
            path.closed = false;
        } catch (eClosedBezier) {}
        path.stroked = true;
        path.strokeWidth = options.strokeWidth || 1;
        path.strokeColor = options.color || FRAME_COLOR;
        path.filled = false;
        if (options.name) {
            try {
                path.name = options.name;
            } catch (eBezierName) {}
        }
        path.setEntirePath([startAnchor, endAnchor]);
        var pts = path.pathPoints;
        if (pts && pts.length === 2) {
            var startPt = pts[0];
            startPt.pointType = control1 ? PointType.SMOOTH : PointType.CORNER;
            startPt.leftDirection = startAnchor;
            startPt.rightDirection = control1Anchor;
            var endPt = pts[1];
            endPt.pointType = control2 ? PointType.SMOOTH : PointType.CORNER;
            endPt.leftDirection = control2Anchor;
            endPt.rightDirection = endAnchor;
        }
        return path;
    }

    function setHorizontalHandle(pathItem, pointIndex, side, lengthCm, directionSign) {
        try {
            if (!pathItem) return;
            var pts = pathItem.pathPoints;
            if (!pts || pointIndex < 0 || pointIndex >= pts.length) return;
            var pt = pts[pointIndex];
            var effectiveLength = (!isNaN(lengthCm) && lengthCm > 0) ? lengthCm : MIN_HANDLE_LENGTH_CM;
            var delta = cm(effectiveLength) * (directionSign >= 0 ? 1 : -1);
            pt.pointType = PointType.SMOOTH;
            if (side === 'left') {
                pt.leftDirection = [pt.anchor[0] + delta, pt.anchor[1]];
                pt.rightDirection = pt.anchor;
            } else {
                pt.rightDirection = [pt.anchor[0] + delta, pt.anchor[1]];
                pt.leftDirection = pt.anchor;
            }
        } catch (eHandle) {}
    }

    function isVerticalLine(pA, pB) {
        return Math.abs(pA.x - pB.x) < 0.0001 && Math.abs(pA.y - pB.y) > 0.0001;
    }

    function isHorizontalLine(pA, pB) {
        return Math.abs(pA.y - pB.y) < 0.0001 && Math.abs(pA.x - pB.x) > 0.0001;
    }

    function midpoint(pA, pB) {
        return {
            x: (pA.x + pB.x) / 2,
            y: (pA.y + pB.y) / 2
        };
    }

    function offsetAlongNormal(pA, pB, offsetCm) {
        var mid = midpoint(pA, pB);
        if (!offsetCm) return mid;
        var dx = pB.x - pA.x;
        var dy = pB.y - pA.y;
        var len = Math.sqrt((dx * dx) + (dy * dy));
        if (len < 0.0001) return mid;
        var nx = dy / len;
        var ny = -dx / len;
        return {
            x: mid.x + nx * offsetCm,
            y: mid.y + ny * offsetCm
        };
    }

    function rotatePoint(pt, pivot, angleRadians) {
        if (!pt || !pivot || isNaN(angleRadians)) return null;
        var cosA = Math.cos(angleRadians);
        var sinA = Math.sin(angleRadians);
        var dx = pt.x - pivot.x;
        var dy = pt.y - pivot.y;
        return {
            x: pivot.x + (dx * cosA) - (dy * sinA),
            y: pivot.y + (dx * sinA) + (dy * cosA)
        };
    }

    function rotateVerticalLabel(tf, anchor) {
        if (!tf) return;
        var rotationDegrees = -90;
        var extraRotation = 180;
        var rotated = false;
        try {
            tf.rotate(rotationDegrees);
            rotated = true;
        } catch (eRotFrame) {}
        if (!rotated) {
            try {
                tf.textRange.characterAttributes.rotation = rotationDegrees;
                rotated = true;
            } catch (eRot) {}
        }
        if (rotated) {
            var extraApplied = false;
            try {
                tf.rotate(extraRotation);
                extraApplied = true;
            } catch (eExtraFrame) {}
            if (!extraApplied) {
                try {
                    tf.textRange.characterAttributes.rotation = rotationDegrees + extraRotation;
                    extraApplied = true;
                } catch (eExtraChar) {}
            }
            try {
                centerTextFrame(tf, anchor);
            } catch (eCenter) {}
        }
    }

    function computeLabelPoint(pA, pB, text) {
        var vertical = isVerticalLine(pA, pB);
        var horizontal = isHorizontalLine(pA, pB);
        var basePoint;
        if (text === 'Front Arm Line') {
            basePoint = offsetAlongNormal(pA, pB, FRONT_ARM_LABEL_NORMAL_OFFSET_CM);
        } else if (vertical) {
            basePoint = {
                x: pA.x - LABEL_RIGHT_OFFSET_CM,
                y: (pA.y + pB.y) / 2
            };
        } else if (horizontal) {
            basePoint = lineLabelAnchor(pA, pB);
        } else {
            basePoint = midpoint(pA, pB);
        }
        var smallOffset = LABEL_SMALL_OFFSET_CM;
        switch (text) {
            case 'Back Arm Line':
                labelAlignmentRefs.backArmLineY = basePoint.y;
                basePoint = {
                    x: pA.x + smallOffset,
                    y: basePoint.y
                };
                break;
            case 'Front Arm Line':
                if (labelAlignmentRefs.backArmLineY !== undefined) basePoint.y = labelAlignmentRefs.backArmLineY;
                break;
            case 'Back Side Line':
                if (labelAlignmentRefs.backArmLineY !== undefined) basePoint.y = labelAlignmentRefs.backArmLineY;
                labelAlignmentRefs.backSideLineY = basePoint.y;
                basePoint = {
                    x: pA.x - smallOffset,
                    y: basePoint.y
                };
                break;
            case 'Front Side Line':
                if (labelAlignmentRefs.backArmLineY !== undefined) basePoint.y = labelAlignmentRefs.backArmLineY;
                basePoint = {
                    x: pA.x + smallOffset,
                    y: basePoint.y
                };
                break;
            case 'Front Dart Line':
                if (labelAlignmentRefs.backArmLineY !== undefined) basePoint.y = labelAlignmentRefs.backArmLineY;
                basePoint = {
                    x: pA.x - smallOffset,
                    y: basePoint.y
                };
                break;
            case 'Back Dart Line':
                if (labelAlignmentRefs.backArmLineY !== undefined) basePoint.y = labelAlignmentRefs.backArmLineY;
                basePoint = {
                    x: pA.x + smallOffset,
                    y: basePoint.y
                };
                break;
            case 'Back Armhole Dart Line (35-37)':
            case 'Back Armhole Dart Line (36-37)':
                if (labelAlignmentRefs.backArmLineY !== undefined) basePoint.y = labelAlignmentRefs.backArmLineY;
                basePoint = {
                    x: pA.x + smallOffset,
                    y: basePoint.y
                };
                break;
            case 'Centre Front (CF)':
                basePoint = {
                    x: pA.x + smallOffset,
                    y: (pA.y + pB.y) / 2
                };
                break;
            case 'Centre Back (CB)':
                basePoint = {
                    x: pA.x - smallOffset,
                    y: (pA.y + pB.y) / 2
                };
                break;
        }
        return basePoint;
    }

    function ensureReferenceArtboard(widthCm, heightCm, gapCm) {
        var targetName = 'Measurement Reference';
        var widthPts = cm(widthCm);
        var heightPts = cm(heightCm);
        var gapPts = cm(gapCm || 0);
        for (var i = 0; i < doc.artboards.length; i++) {
            var art = doc.artboards[i];
            if (art.name === targetName) {
                var rect = art.artboardRect;
                art.artboardRect = [rect[0], rect[1], rect[0] + widthPts, rect[1] - heightPts];
                return {
                    index: i,
                    artboard: art,
                    rect: art.artboardRect
                };
            }
        }
        var baseRect = artboardRect;
        var left = baseRect[2] + gapPts;
        var top = baseRect[1];
        var newRect = [left, top, left + widthPts, top - heightPts];
        var added = doc.artboards.add(newRect);
        try {
            added.name = targetName;
        } catch (eNameArt) {}
        return {
            index: doc.artboards.length - 1,
            artboard: added,
            rect: added.artboardRect
        };
    }

    function formatReferenceValue(value) {
        if (value === undefined || value === null) return '-';
        var num = parseFloat(value);
        if (!isNaN(num)) return formatValue(num);
        if (value === true) return 'Yes';
        if (value === false) return 'No';
        return String(value);
    }

    function collectMeasurementRows() {
        var rows = [];
        var seen = {};
        for (var key in measurementResults) {
            if (!measurementResults.hasOwnProperty(key)) continue;
            if (seen[key]) continue;
            seen[key] = true;
            rows.push({
                id: key,
                meas: formatReferenceValue(measurementResults[key]),
                ease: formatReferenceValue(easeResults[key]),
                finalValue: formatReferenceValue(finalResults[key])
            });
        }
        rows.sort(function(a, b) {
            if (a.id < b.id) return -1;
            if (a.id > b.id) return 1;
            return 0;
        });
        return rows;
    }

    function closeMeasurementPalette() {
        try {
            if (measurementPalette && typeof measurementPalette.close === 'function') {
                measurementPalette.close();
            }
        } catch (eCloseLocal) {}
        try {
            var globalPalette = $.global.hofenbitzerMeasurementPalette;
            if (globalPalette && globalPalette.window && typeof globalPalette.window.close === 'function') {
                globalPalette.window.close();
            }
            delete $.global.hofenbitzerMeasurementPalette;
        } catch (eCloseGlobal) {}
        measurementPalette = null;
    }

    function buildPaletteStaticText(group, label, width, justification) {
        var st = group.add('statictext', undefined, label);
        if (width !== undefined) {
            st.preferredSize.width = width;
            st.minimumSize.width = width;
        }
        if (justification) {
            try {
                st.justify = justification;
            } catch (eJustSet) {}
        }
        return st;
    }

    function showMeasurementPaletteWindow(profileName) {
        closeMeasurementPalette();
        var palette = new Window('palette', 'Measurement Summary');
        palette.orientation = 'column';
        palette.alignChildren = ['fill', 'top'];
        palette.spacing = 8;
        palette.margins = 12;
        palette.preferredSize.width = 560;

        var metaGroup = palette.add('group');
        metaGroup.alignment = 'fill';
        metaGroup.add('statictext', undefined, 'Fit Profile: ' + (profileName || '-'));

        var headerGroup = palette.add('group');
        headerGroup.alignment = 'fill';
        headerGroup.spacing = 6;
        var columnWidths = [200, 120, 120, 120];
        buildPaletteStaticText(headerGroup, 'Measurement', columnWidths[0], 'left');
        buildPaletteStaticText(headerGroup, 'Measure', columnWidths[1], 'right');
        buildPaletteStaticText(headerGroup, 'Ease', columnWidths[2], 'right');
        buildPaletteStaticText(headerGroup, 'Final', columnWidths[3], 'right');

        var rows = collectMeasurementRows();
        if (!rows.length) {
            var emptyRow = palette.add('group');
            emptyRow.alignment = 'fill';
            emptyRow.add('statictext', undefined, 'No measurements available.');
        } else {
            for (var i = 0; i < rows.length; i++) {
                var row = rows[i];
                var rowGroup = palette.add('group');
                rowGroup.alignment = 'fill';
                rowGroup.spacing = 6;
                buildPaletteStaticText(rowGroup, row.id, columnWidths[0], 'left');
                buildPaletteStaticText(rowGroup, row.meas, columnWidths[1], 'right');
                buildPaletteStaticText(rowGroup, row.ease, columnWidths[2], 'right');
                buildPaletteStaticText(rowGroup, row.finalValue, columnWidths[3], 'right');
            }
        }

        palette.onClose = function() {
            measurementPalette = null;
            try {
                delete $.global.hofenbitzerMeasurementPalette;
            } catch (eDeleteGlobal) {}
        };

        measurementPalette = palette;
        $.global.hofenbitzerMeasurementPalette = {
            window: palette
        };
        try {
            palette.show();
        } catch (eShow) {}
    }

    function addReferenceText(container, content, x, y, sizePt, bold, justification) {
        var tf = container.textFrames.add();
        tf.contents = content;
        try {
            tf.textRange.characterAttributes.size = sizePt;
        } catch (eSize) {}
        var fontName = bold ? 'Arial-BoldMT' : 'ArialMT';
        try {
            tf.textRange.characterAttributes.textFont = app.textFonts.getByName(fontName);
        } catch (eFontBold) {
            try {
                tf.textRange.characterAttributes.textFont = app.textFonts.getByName('ArialMT');
            } catch (eFontNormal) {}
        }
        if (justification) {
            try {
                tf.textRange.paragraphAttributes.justification = justification;
            } catch (eJust) {}
        }
        tf.position = [x, y];
        return tf;
    }

    function drawReferenceLine(container, x1, y1, x2, y2) {
        var line = container.pathItems.add();
        line.setEntirePath([
            [x1, y1],
            [x2, y2]
        ]);
        line.stroked = true;
        line.strokeWidth = 0.5;
        line.strokeColor = FRAME_COLOR;
        line.filled = false;
        return line;
    }

    function populateMeasurementReference(container, rect) {
        var marginPts = cm(REFERENCE_TABLE_MARGIN_CM);
        var startX = rect[0] + marginPts;
        var startY = rect[1] - marginPts;
        var colPositions = [];
        for (var i = 0; i < REFERENCE_TABLE_COL_OFFSETS_CM.length; i++) {
            colPositions.push(startX + cm(REFERENCE_TABLE_COL_OFFSETS_CM[i]));
        }
        var tableWidthPts = cm(REFERENCE_TABLE_TOTAL_WIDTH_CM);
        var rowSpacingPts = cm(REFERENCE_TABLE_ROW_HEIGHT_CM);
        var currentY = startY;
        addReferenceText(container, 'Measurement Reference', startX, currentY, REFERENCE_TITLE_FONT_SIZE_PT, true);
        currentY -= cm(1.0);
        var tableTopY = currentY;
        drawReferenceLine(container, startX, tableTopY, startX + tableWidthPts, tableTopY);
        currentY -= cm(0.6);
        var fitProfileY = currentY;
        addReferenceText(container, 'Fit Profile: ' + (selectedProfile ? selectedProfile.name : ''), startX, fitProfileY, REFERENCE_BODY_FONT_SIZE_PT, false);
        currentY -= cm(0.3);
        currentY -= cm(0.3);
        var headers = ['ID', 'Measure', 'Ease', 'Final'];
        var headerTextY = currentY;
        for (var h = 0; h < headers.length; h++) {
            addReferenceText(container, headers[h], colPositions[h], headerTextY, REFERENCE_HEADER_FONT_SIZE_PT, true, h === 0 ? Justification.LEFT : Justification.RIGHT);
        }
        var headerDividerY = headerTextY - cm(0.4);
        drawReferenceLine(container, startX, headerDividerY, startX + tableWidthPts, headerDividerY);
        var rows = collectMeasurementRows();
        var bottomDividerY = headerDividerY;
        if (rows.length === 0) {
            bottomDividerY = headerDividerY - rowSpacingPts;
            drawReferenceLine(container, startX, bottomDividerY, startX + tableWidthPts, bottomDividerY);
        } else {
            for (var r = 0; r < rows.length; r++) {
                var row = rows[r];
                var rowTopY = headerDividerY - r * rowSpacingPts;
                var nextDividerY = rowTopY - rowSpacingPts;
                var rowTextY = (rowTopY + nextDividerY) / 2 + cm(0.15);
                addReferenceText(container, row.id, colPositions[0], rowTextY, REFERENCE_BODY_FONT_SIZE_PT, false, Justification.LEFT);
                addReferenceText(container, row.meas, colPositions[1], rowTextY, REFERENCE_BODY_FONT_SIZE_PT, false, Justification.RIGHT);
                addReferenceText(container, row.ease, colPositions[2], rowTextY, REFERENCE_BODY_FONT_SIZE_PT, false, Justification.RIGHT);
                addReferenceText(container, row.finalValue, colPositions[3], rowTextY, REFERENCE_BODY_FONT_SIZE_PT, false, Justification.RIGHT);
                drawReferenceLine(container, startX, nextDividerY, startX + tableWidthPts, nextDividerY);
                bottomDividerY = nextDividerY;
            }
        }
        drawReferenceLine(container, startX, tableTopY, startX, bottomDividerY);
        drawReferenceLine(container, startX + tableWidthPts, tableTopY, startX + tableWidthPts, bottomDividerY);
        for (var c = 1; c < colPositions.length; c++) {
            drawReferenceLine(container, colPositions[c], tableTopY, colPositions[c], bottomDividerY);
        }
    }

    function generateMeasurementReference() {
        try {
            var refInfo = ensureReferenceArtboard(30, 40, 10);
            if (!refInfo) return;
            var prevIndex = doc.artboards.getActiveArtboardIndex();
            try {
                doc.artboards.setActiveArtboardIndex(refInfo.index);
            } catch (eIndex) {}
            var referenceLayer = ensureLayer('Measurement Reference');
            try {
                referenceLayer.locked = false;
            } catch (eUnlockRef) {}
            try {
                referenceLayer.visible = true;
            } catch (eVisibleRef) {}
            var refGroup = resetGroup(referenceLayer, 'Measurement Reference Content');
            populateMeasurementReference(refGroup, refInfo.rect);
            cropArtboardAroundItems(refInfo.index, [refGroup], 5);
            try {
                doc.artboards.setActiveArtboardIndex(prevIndex);
            } catch (eRestore) {}
        } catch (eReference) {}
    }

    function getItemBounds(item) {
        if (!item) return null;
        var bounds = null;
        try {
            bounds = item.visibleBounds;
        } catch (eVisibleBounds) {}
        if (!bounds) {
            try {
                bounds = item.geometricBounds;
            } catch (eGeoBounds) {}
        }
        return bounds;
    }

    function unionBounds(current, candidate) {
        if (!candidate) return current;
        if (!current) return [candidate[0], candidate[1], candidate[2], candidate[3]];
        if (candidate[0] < current[0]) current[0] = candidate[0];
        if (candidate[1] > current[1]) current[1] = candidate[1];
        if (candidate[2] > current[2]) current[2] = candidate[2];
        if (candidate[3] < current[3]) current[3] = candidate[3];
        return current;
    }

    function cropArtboardAroundItems(artboardIndex, items, marginCm) {
        if (artboardIndex < 0 || artboardIndex >= doc.artboards.length) return;
        if (!items || !items.length) return;
        var union = null;
        for (var i = 0; i < items.length; i++) {
            var bounds = getItemBounds(items[i]);
            if (!bounds) continue;
            union = unionBounds(union, bounds);
        }
        if (!union) return;
        var marginPts = cm(marginCm);
        var newRect = [union[0] - marginPts, union[1] + marginPts, union[2] + marginPts, union[3] - marginPts];
        try {
            doc.artboards[artboardIndex].artboardRect = newRect;
        } catch (eCrop) {}
    }

    function drawLineWithLabel(pA, pB, text, color) {
        var path = drawFrameLine(pA, pB, text, color);
        if (!text) return path;
        var labelPoint = computeLabelPoint(pA, pB, text);
        var tf = drawCenteredLabel(labelPoint, text);
        if (tf && isVerticalLine(pA, pB)) {
            rotateVerticalLabel(tf, toArt(labelPoint));
        }
        return path;
    }

    function centerTextFrame(tf, anchor) {
        if (!tf) return;
        try {
            var bounds = tf.visibleBounds;
            tf.translate(anchor[0] - (bounds[0] + bounds[2]) / 2, anchor[1] - (bounds[1] + bounds[3]) / 2);
        } catch (eBounds) {
            try {
                tf.left = anchor[0] - (tf.width / 2);
                tf.top = anchor[1] + (tf.height / 2);
            } catch (eFallback) {}
        }
    }

    function placeFrameMarker(pt, label) {
        var anchor = toArt(pt);
        var radius = cm(MARKER_RADIUS_CM);
        var circle = markersGroup.pathItems.ellipse(anchor[1] + radius, anchor[0] - radius, radius * 2, radius * 2);
        if (label != null) {
            try {
                circle.name = 'Marker ' + label;
            } catch (eMkName) {}
        }
        circle.stroked = true;
        circle.strokeWidth = 1;
        circle.strokeColor = FRAME_COLOR;
        circle.filled = true;
        circle.fillColor = FRAME_COLOR;
        if (label != null) {
            var tf = numbersGroup.textFrames.add();
            tf.contents = String(label);
            try {
                tf.name = 'Marker ' + label + ' Number';
            } catch (eNumName) {}
            tf.textRange.characterAttributes.size = NUMBER_FONT_SIZE_PT;
            tf.textRange.characterAttributes.fillColor = NUMBER_FILL_COLOR;
            try {
                tf.textRange.characterAttributes.textFont = app.textFonts.getByName('ArialMT');
            } catch (eFont) {}
            try {
                tf.textRange.paragraphAttributes.justification = Justification.CENTER;
            } catch (eJust) {}
            try {
                tf.textRange.characterAttributes.baselineShift = 0;
            } catch (eShift) {}
            centerTextFrame(tf, anchor);
            try {
                circle.zOrder(ZOrderMethod.SENDTOBACK);
            } catch (eZ) {}
        }
        return circle;
    }

    function drawCenteredLabel(midPoint, text) {
        var anchor = toArt(midPoint);
        var tf = labelsGroup.textFrames.add();
        tf.contents = text;
        tf.textRange.characterAttributes.size = LABEL_FONT_SIZE_PT;
        try {
            tf.textRange.characterAttributes.textFont = app.textFonts.getByName('ArialMT');
        } catch (eFont) {}
        tf.textRange.characterAttributes.fillColor = makeRGB(0, 0, 0);
        centerTextFrame(tf, anchor);
        return tf;
    }

    function lineLabelAnchor(startPt, endPt) {
        var midX = (startPt.x + endPt.x) / 2;
        var hemX = startPt.x - LABEL_RIGHT_OFFSET_CM;
        var baseX = (midX + hemX) / 2 + LINE_LABEL_HORIZONTAL_SHIFT_CM;
        return {
            x: baseX,
            y: startPt.y - LABEL_VERTICAL_OFFSET_CM
        };
    }

    function extendLineToY(pA, pB, targetY) {
        var dy = pB.y - pA.y;
        var dx = pB.x - pA.x;
        if (Math.abs(dy) < 0.0001) {
            return {
                x: pB.x,
                y: targetY
            };
        }
        var t = (targetY - pA.y) / dy;
        return {
            x: pA.x + dx * t,
            y: targetY
        };
    }

    function pointAlongLineByDistance(pA, pB, distanceCm) {
        if (!pA || !pB) return pA;
        if (isNaN(distanceCm) || distanceCm <= 0) {
            return {
                x: pA.x,
                y: pA.y
            };
        }
        var dx = pB.x - pA.x;
        var dy = pB.y - pA.y;
        var len = Math.sqrt((dx * dx) + (dy * dy));
        if (len < 1e-6) {
            return {
                x: pA.x,
                y: pA.y
            };
        }
        var scale = distanceCm / len;
        return {
            x: pA.x + dx * scale,
            y: pA.y + dy * scale
        };
    }
    var rightBoundaryCm = (artboardRect[2] - originX) / cm(1);
    var topBoundaryCm = (originY - artboardRect[1]) / cm(1);
    var point1 = {
        x: rightBoundaryCm - 10,
        y: topBoundaryCm + 10
    };
    placeFrameMarker([point1.x, point1.y], 1);
    var point1aOffset = NeG + 0.5;
    if (isNaN(point1aOffset)) point1aOffset = NeG;
    var point1a = {
        x: point1.x - point1aOffset,
        y: point1.y
    };
    var point1aExtension = {
        x: point1a.x - 10,
        y: point1a.y
    };
    var line1To1a = drawFrameLine([point1.x, point1.y], [point1a.x, point1a.y], '1 - 1a');
    try {
        line1To1a.strokeDashes = DASH_PATTERN;
    } catch (eDash1a) {}
    var line1aExtensionPath = drawFrameLine([point1a.x, point1a.y], [point1aExtension.x, point1aExtension.y], '1a - Extension');
    try {
        line1aExtensionPath.strokeDashes = DASH_PATTERN;
    } catch (eDash1aExt) {}
    placeFrameMarker([point1a.x, point1a.y], '1a');
    var dist12 = (NeG / 3) + 1;
    var point2 = {
        x: point1.x,
        y: point1.y + dist12
    };
    placeFrameMarker([point2.x, point2.y], 2);
    var curveBulgeCm = -Math.max(0.5, (NeG + 0.5) / 3);
    var backNeckCurve = drawCurveBetween(point1a, point2, {
        name: 'Back Neck Curve',
        bulgeCm: curveBulgeCm
    });
    if (backNeckCurve) {
        var backHandleLength = Math.max(MIN_HANDLE_LENGTH_CM, NeG / 2);
        setHorizontalHandle(backNeckCurve, 1, 'left', backHandleLength, -1);
    }
    var frontShoulderEnd = null;
    var backShoulderEnd = null;
    var point16 = null;
    var point3 = {
        x: point2.x,
        y: point2.y + MoL
    };
    placeFrameMarker([point3.x, point3.y], 3);
    var point4 = {
        x: point2.x,
        y: point2.y + AhDPlus
    };
    placeFrameMarker([point4.x, point4.y], 4);
    var point5 = {
        x: point2.x,
        y: point2.y + BLFinal
    };
    placeFrameMarker([point5.x, point5.y], 5);
    var point6 = {
        x: point5.x,
        y: point5.y + HiD
    };
    placeFrameMarker([point6.x, point6.y], 6);
    var hemLineStart = {
        x: point3.x,
        y: point3.y
    };
    var bustLineStart = {
        x: point4.x,
        y: point4.y
    };
    var waistLineStart = {
        x: point5.x,
        y: point5.y
    };
    var hipLineStart = {
        x: point6.x,
        y: point6.y
    };
    var point7 = {
        x: point5.x - BackContour,
        y: point5.y
    };
    placeFrameMarker([point7.x, point7.y], 7);
    var point8 = {
        x: point3.x - BackContour,
        y: point3.y
    };
    placeFrameMarker([point8.x, point8.y], 8);
    var point6a = {
        x: point6.x - HIP_LEFT_OFFSET_CM,
        y: point6.y
    };
    placeFrameMarker([point6a.x, point6a.y], '6a');
    var point9 = extendLineToY(point2, point7, point4.y);
    placeFrameMarker([point9.x, point9.y], 9);
    var centreBackContoured = drawFrameLine([point2.x, point2.y], [point8.x, point8.y], 'Centre Back (CB) - Contoured', CONNECTOR_BLUE_COLOR);
    if (centreBackContoured) {
        centreBackContoured.setEntirePath([toArt(point2), toArt(point7), toArt(point8)]);
    }
    var backArmBase = point9;
    var AGPlus = finalResults['AG'];
    if (isNaN(AGPlus)) AGPlus = parseField(rowRefs['AG'].finalField, 0);
    if (isNaN(AGPlus)) AGPlus = 0;
    var BGPlus = finalResults['BG'];
    if (isNaN(BGPlus)) BGPlus = parseField(rowRefs['BG'].finalField, 0);
    if (isNaN(BGPlus)) BGPlus = 0;
    var BrGPlus = finalResults['BrG'];
    if (isNaN(BrGPlus)) BrGPlus = parseField(rowRefs['BrG'].finalField, 0);
    if (isNaN(BrGPlus)) BrGPlus = 0;
    var point10 = {
        x: backArmBase.x - BGPlus,
        y: bustLineStart.y
    };
    var point11 = {
        x: point10.x - (AGPlus * 2 / 3),
        y: point10.y
    };
    var point12 = {
        x: point11.x - 10,
        y: point11.y
    };
    var point13 = {
        x: point12.x - (AGPlus / 3),
        y: point12.y
    };
    var point14 = {
        x: point13.x - BrGPlus,
        y: point13.y
    };
    placeFrameMarker([point10.x, point10.y], 10);
    placeFrameMarker([point11.x, point11.y], 11);
    placeFrameMarker([point12.x, point12.y], 12);
    placeFrameMarker([point13.x, point13.y], 13);
    var point13aOffset = AGPlus / 4;
    if (isNaN(point13aOffset)) point13aOffset = 0;
    var point13a = {
        x: point13.x,
        y: point13.y - point13aOffset
    };
    placeFrameMarker([point13a.x, point13a.y], '13a');
    placeFrameMarker([point14.x, point14.y], 14);
    if (bShS > 0) {
        var frontShoulderRadians = frontShoulderAngle * Math.PI / 180;
        frontShoulderEnd = {
            x: point1a.x - Math.cos(frontShoulderRadians) * bShS,
            y: point1a.y + Math.sin(frontShoulderRadians) * bShS
        };
        var backShoulderRadians = backShoulderAngle * Math.PI / 180;
        var dirX = -Math.cos(backShoulderRadians);
        var dirY = Math.sin(backShoulderRadians);
        var lineLength = bShS;
        var tIntersect = null;
        if (Math.abs(dirX) > 0.0001) {
            var candidateT = (point10.x - point1a.x) / dirX;
            if (candidateT >= 0) tIntersect = candidateT;
        } else if (Math.abs(point10.x - point1a.x) < 0.0001) {
            tIntersect = 0;
        }
        var effectiveLength = lineLength;
        if (tIntersect !== null && tIntersect > effectiveLength) effectiveLength = tIntersect;
        backShoulderEnd = {
            x: point1a.x + dirX * effectiveLength,
            y: point1a.y + dirY * effectiveLength
        };
        if (tIntersect !== null) {
            point16 = {
                x: point10.x,
                y: point1a.y + dirY * tIntersect
            };
        }
        backShoulderLinePath = drawFrameLine([point1a.x, point1a.y], [backShoulderEnd.x, backShoulderEnd.y], 'Back Shoulder Line');
    }
    if (point16) {
        placeFrameMarker([point16.x, point16.y], '16');
    }
    var point17 = null;
    var point17a = null;
    var point18 = null;
    var point32 = null;
    var point32Top = null;
    var point31 = null;
    var point33 = null;
    var point35 = null;
    var point36 = null;
    var point37 = null;
    var point38 = null;
    var pointA = null;
    var combinedBackShoulderDartDrawn = false;
    var point42 = null;
    var shoulderBladeLine = null;
    var backShoulderLinePath = null;
    var frontShoulderDartRotation = 0;
    if (point16) {
        var midpoint1610 = {
            x: (point16.x + point10.x) / 2,
            y: (point16.y + point10.y) / 2
        };
        point17 = {
            x: midpoint1610.x - 1,
            y: midpoint1610.y
        };
        placeFrameMarker([point17.x, point17.y], '17');
        if (backShoulderDartIntake > 0) {
            var halfBackDart = backShoulderDartIntake / 2;
            point35 = {
                x: point17.x,
                y: point17.y - halfBackDart
            };
            point36 = {
                x: point17.x,
                y: point17.y + halfBackDart
            };
            placeFrameMarker([point35.x, point35.y], '35');
            placeFrameMarker([point36.x, point36.y], '36');
        }
        var shoulderBladeEnd = {
            x: point2.x,
            y: point17.y
        };
        shoulderBladeLine = drawLineWithLabel({
            x: point17.x,
            y: point17.y
        }, shoulderBladeEnd, 'Shoulder Blade Line', FRAME_COLOR);
        try {
            shoulderBladeLine.strokeDashes = DASH_PATTERN;
        } catch (eDashShoulder) {}
        var midpoint1710 = {
            x: (point17.x + point10.x) / 2,
            y: (point17.y + point10.y) / 2
        };
        point17a = {
            x: midpoint1710.x - 1.5,
            y: midpoint1710.y
        };
        placeFrameMarker([point17a.x, point17a.y], '17a');
        point18 = {
            x: point13.x,
            y: point17a.y
        };
        var line17a18 = drawFrameLine([point17a.x, point17a.y], [point18.x, point18.y], '17a - 18', undefined, dartsLinesGroup);
        try {
            line17a18.strokeDashes = DASH_PATTERN;
        } catch (eDash17a18) {}
        placeFrameMarker([point18.x, point18.y], '18');
        var BrCValue = finalResults['BrC'];
        if (isNaN(BrCValue) && rowRefs && rowRefs['BrC'] && rowRefs['BrC'].measField) {
            BrCValue = parseField(rowRefs['BrC'].measField, defaults.BrC);
        }
        if (isNaN(BrCValue)) BrCValue = defaults.BrC;
        if (!isNaN(BrCValue)) {
            var point32Offset = (BrCValue / 20) + 1;
            point32 = {
                x: point18.x + point32Offset,
                y: point18.y
            };
            placeFrameMarker([point32.x, point32.y], '32');
            point32Top = {
                x: point32.x,
                y: point32.y - 15
            };
        var line32Guide = drawFrameLine([point32.x, point32.y], [point32Top.x, point32Top.y], 'Shoulder Dart Guide Line', undefined, dartsLinesGroup);
            if (line32Guide) {
                try {
                    line32Guide.strokeDashes = DASH_PATTERN;
                } catch (eLine32) {}
            }
        }
    }
    var topLineY = point1.y;
    var bustLineY = bustLineStart.y;
    var waistLineY = waistLineStart.y;
    var hipLineY = hipLineStart.y;
    var hemLineY = hemLineStart.y;
    var hemEnd = {
        x: point14.x,
        y: hemLineY
    };
    var bustEnd = {
        x: point14.x,
        y: bustLineY
    };
    var waistEnd = {
        x: point14.x,
        y: waistLineY
    };
    var hipEnd = {
        x: point14.x,
        y: hipLineY
    };
    var point19 = {
        x: point14.x,
        y: waistLineY
    };
    placeFrameMarker([point19.x, point19.y], '19');
    var frontLengthFinal = finalResults['FL'];
    if (isNaN(frontLengthFinal)) frontLengthFinal = defaults.FL;
    var point20Offset = frontLengthFinal - 1;
    if (isNaN(point20Offset) || point20Offset < 0) point20Offset = 0;
    var point20 = {
        x: point19.x,
        y: point19.y - point20Offset
    };
    placeFrameMarker([point20.x, point20.y], '20');
    var point20GuideLength = 20;
    var point20Guide = {
        x: point20.x + point20GuideLength,
        y: point20.y
    };
    var line20Guide = drawFrameLine([point20.x, point20.y], [point20Guide.x, point20Guide.y], '20 Guideline', FRAME_COLOR);
    try {
        line20Guide.strokeDashes = DASH_PATTERN;
    } catch (eDash20) {}
    var point20aOffset = NeG;
    if (isNaN(point20aOffset)) point20aOffset = 0;
    var point20a = {
        x: point20.x + point20aOffset,
        y: point20.y
    };
    placeFrameMarker([point20a.x, point20a.y], '20a');
    var point23Offset = NeG + 0.5;
    if (isNaN(point23Offset)) point23Offset = NeG;
    if (isNaN(point23Offset)) point23Offset = 0;
    var point23 = {
        x: point20.x,
        y: point20.y + point23Offset
    };
    placeFrameMarker([point23.x, point23.y], '23');
    var frontNeckBulge = Math.max(MIN_HANDLE_LENGTH_CM, NeG / 2);
    var frontNeckCurve = drawCurveBetween(point20a, point23, {
        name: 'Front Neck Curve',
        bulgeCm: frontNeckBulge
    });
    if (frontNeckCurve) {
        var frontHandleLength = Math.max(MIN_HANDLE_LENGTH_CM, NeG / 2);
        setHorizontalHandle(frontNeckCurve, 1, 'left', frontHandleLength, 1);
    }
    var point24 = null;
    if (fShSValue > 0) {
        var frontShoulderAngleSafe = isNaN(frontShoulderAngle) ? 0 : frontShoulderAngle;
        var frontShoulderRadiansFront = frontShoulderAngleSafe * Math.PI / 180;
        point24 = {
            x: point20a.x + Math.cos(frontShoulderRadiansFront) * fShSValue,
            y: point20a.y + Math.sin(frontShoulderRadiansFront) * fShSValue
        };
        drawFrameLine([point20a.x, point20a.y], [point24.x, point24.y], 'Front Shoulder Line');
        placeFrameMarker([point24.x, point24.y], '24');
    }
    var BrDValue = finalResults['BrD'];
    if (isNaN(BrDValue)) BrDValue = parseField(rowRefs['BrD'].measField, defaults.BrD);
    if (isNaN(BrDValue)) BrDValue = defaults.BrD;
    var point21Offset = BrDValue - 1;
    if (isNaN(point21Offset) || point21Offset < 0) point21Offset = 0;
    var point21 = {
        x: point20.x,
        y: point20.y + point21Offset
    };
    placeFrameMarker([point21.x, point21.y], '21');
    var dartOffset = (BrGPlus / 2) - 0.3;
    if (isNaN(dartOffset)) dartOffset = 0;
    if (dartOffset < 0) dartOffset = 0;
    var point22 = {
        x: point21.x + dartOffset,
        y: point21.y
    };
    var line21to22 = drawFrameLine([point21.x, point21.y], [point22.x, point22.y], 'Bust Distance');
    try {
        line21to22.strokeDashes = DASH_PATTERN;
    } catch (eDash21) {}
    placeFrameMarker([point22.x, point22.y], '22');
    var frontDartTopY = point20.y;
    if (point24) {
        var shoulderDX = point24.x - point20a.x;
        if (Math.abs(shoulderDX) > 0.0001) {
            var tIntersectDart = (point22.x - point20a.x) / shoulderDX;
            if (tIntersectDart >= 0 && tIntersectDart <= 1) {
                frontDartTopY = point20a.y + (point24.y - point20a.y) * tIntersectDart;
            }
        } else if (Math.abs(point22.x - point20a.x) < 0.0001) {
            var minShoulderY = Math.min(point20a.y, point24.y);
            var maxShoulderY = Math.max(point20a.y, point24.y);
            if (frontDartTopY < minShoulderY) frontDartTopY = minShoulderY;
            if (frontDartTopY > maxShoulderY) frontDartTopY = maxShoulderY;
        }
    }
    if (isNaN(frontDartTopY)) frontDartTopY = point20.y;
    var frontDartTop = {
        x: point22.x,
        y: frontDartTopY
    };
    point31 = {
        x: frontDartTop.x,
        y: frontDartTop.y
    };
    placeFrameMarker([point31.x, point31.y], '31');
    var trianglePoint31 = point31;
    var dartShoulderPoint = point24;
    if (point22 && point24 && point31 && point32) {
        var pivotPoint = point22;
        var relX = point24.x - pivotPoint.x;
        var relY = point24.y - pivotPoint.y;
        var radius = Math.sqrt((relX * relX) + (relY * relY));
        if (radius > 1e-6) {
            var desiredCos = (point32.x - pivotPoint.x) / radius;
            if (desiredCos < -1) desiredCos = -1;
            if (desiredCos > 1) desiredCos = 1;
            var baseAngle = Math.atan2(relY, relX);
            var acosValue = Math.acos(desiredCos);
            if (!isNaN(acosValue)) {
                var candidateAngles = [acosValue, -acosValue];
                var bestRotation = null;
                var bestDiff = null;
                var bestShoulder = null;
                for (var rotIdx = 0; rotIdx < candidateAngles.length; rotIdx++) {
                    var targetAngle = candidateAngles[rotIdx];
                    var rotationCandidate = targetAngle - baseAngle;
                    var rotatedShoulderCandidate = rotatePoint(point24, pivotPoint, rotationCandidate);
                    if (!rotatedShoulderCandidate) continue;
                    var diffX = Math.abs(rotatedShoulderCandidate.x - point32.x);
                    if (bestRotation === null || diffX < bestDiff - 1e-6 || (Math.abs(diffX - bestDiff) < 1e-6 && Math.abs(rotationCandidate) < Math.abs(bestRotation))) {
                        bestRotation = rotationCandidate;
                        bestDiff = diffX;
                        bestShoulder = rotatedShoulderCandidate;
                    }
                }
                if (bestRotation !== null && bestShoulder) {
                    frontShoulderDartRotation = bestRotation;
                    dartShoulderPoint = bestShoulder;
                    var rotated31 = rotatePoint(point31, pivotPoint, bestRotation);
                    if (rotated31) trianglePoint31 = rotated31;
                }
            }
        }
    }
    if (dartsLinesGroup && point22 && trianglePoint31 && dartShoulderPoint) {
        try {
            var existingFrontDartTriangles = dartsLinesGroup.pathItems;
            for (var triIdx = existingFrontDartTriangles.length - 1; triIdx >= 0; triIdx--) {
                var triangleCandidate = existingFrontDartTriangles[triIdx];
                if (!triangleCandidate) continue;
                var triangleName = '';
                try {
                    triangleName = triangleCandidate.name;
                } catch (eTriangleNameRead) {}
                if (triangleName === 'Front Shoulder Dart Triangle') {
                    try {
                        triangleCandidate.remove();
                    } catch (eTriangleRemove) {}
                }
            }
        } catch (eTriangleSweep) {}
        var frontDartTriangle = dartsLinesGroup.pathItems.add();
        try {
            frontDartTriangle.name = 'Front Shoulder Dart Triangle';
        } catch (eTriangleName) {}
        frontDartTriangle.stroked = true;
        frontDartTriangle.strokeWidth = 1;
        frontDartTriangle.strokeColor = DART_TRIANGLE_COLOR;
        frontDartTriangle.filled = false;
        frontDartTriangle.closed = true;
        try {
            frontDartTriangle.strokeDashes = [];
        } catch (eTriangleDash) {}
        frontDartTriangle.setEntirePath([toArt(point22), toArt(trianglePoint31), toArt(dartShoulderPoint), toArt(point22)]);
    }
    if (dartShoulderPoint && dartShoulderPoint !== point24) {
        point33 = {
            x: dartShoulderPoint.x,
            y: dartShoulderPoint.y
        };
        placeFrameMarker([point33.x, point33.y], '33');
    }
    if (latestDerived && typeof latestDerived === 'object') {
        latestDerived.frontShoulderDartRotation = frontShoulderDartRotation;
    }
    if (point33 && point22 && point12 && point13 && linesGroup) {
        try {
            var existingArmholes = linesGroup.pathItems;
            for (var armIdx = existingArmholes.length - 1; armIdx >= 0; armIdx--) {
                var armCandidate = existingArmholes[armIdx];
                if (!armCandidate) continue;
                var armName = '';
                try {
                    armName = armCandidate.name;
                } catch (eArmNameRead) {}
                if (armName === 'Front Armhole Curve (33-12)') {
                    try {
                        armCandidate.remove();
                    } catch (eArmRemove) {}
                }
            }
        } catch (eArmSweep) {}
        var startHandlePoint = pointAlongLineByDistance(point33, point22, FRONT_ARMHOLE_START_HANDLE_CM);
        if (!startHandlePoint) startHandlePoint = {
            x: point33.x,
            y: point33.y
        };
        var endHandlePoint = pointAlongLineByDistance(point12, point13, FRONT_ARMHOLE_END_HANDLE_CM);
        if (!endHandlePoint) endHandlePoint = {
            x: point12.x,
            y: point12.y
        };
        drawBezierCurve(point33, point12, startHandlePoint, endHandlePoint, {
            name: 'Front Armhole Curve (33-12)',
            color: FRAME_COLOR,
            targetGroup: linesGroup
        });
    }
    var frontDartBottom = {
        x: point22.x,
        y: hemLineY
    };
    var centreBackLinePath = drawLineWithLabel({
        x: point2.x,
        y: topLineY
    }, {
        x: point2.x,
        y: hemLineY
    }, 'Centre Back (CB)', FRAME_COLOR);
    if (centreBackLinePath) {
        try {
            centreBackLinePath.strokeDashes = DASH_PATTERN;
        } catch (eDashCentreBack) {}
    }
    var backArmLineTopY = point16 ? point16.y : topLineY;
    var backArmLineStart = {
        x: point10.x,
        y: backArmLineTopY
    };
    var backArmLineEnd = {
        x: point10.x,
        y: hipLineY
    };
    var backArmLinePath = drawLineWithLabel(backArmLineStart, backArmLineEnd, 'Back Arm Line', FRAME_COLOR);
    if (backArmLinePath) {
        try {
            backArmLinePath.strokeDashes = DASH_PATTERN;
        } catch (eDashBackArm) {}
    }
    var backWaistMidpoint = null;
    if (point7 && point10) {
        backWaistMidpoint = {
            x: (point7.x + point10.x) / 2,
            y: waistLineY
        };
    } else if (point2 && point10) {
        backWaistMidpoint = {
            x: (point2.x + point10.x) / 2,
            y: waistLineY
        };
    }
    if (backWaistMidpoint) {
        placeFrameMarker([backWaistMidpoint.x, backWaistMidpoint.y], '34');
        var backMidTopY = backShoulderEnd ? backShoulderEnd.y : topLineY;
        if (backShoulderEnd && point1a) {
            var shoulderDx = backShoulderEnd.x - point1a.x;
            if (Math.abs(shoulderDx) > 1e-6) {
                var tAlongShoulder = (backWaistMidpoint.x - point1a.x) / shoulderDx;
                backMidTopY = point1a.y + (backShoulderEnd.y - point1a.y) * tAlongShoulder;
            }
        }
        var backMidTop = {
            x: backWaistMidpoint.x,
            y: backMidTopY
        };
        var backMidBottom = {
            x: backWaistMidpoint.x,
            y: hipLineY
        };
        var backWaistMidLine = drawLineWithLabel(backMidTop, backMidBottom, 'Back Dart Line', FRAME_COLOR);
        var dartApex = {
            x: backMidTop.x,
            y: point17 ? point17.y : backMidTop.y
        };
        point37 = dartApex;
        placeFrameMarker([point37.x, point37.y], '37');
        var point38Candidate = null;
        if (point1a && backShoulderEnd) {
            var shoulderDxTop = backShoulderEnd.x - point1a.x;
            var shoulderDyTop = backShoulderEnd.y - point1a.y;
            if (Math.abs(shoulderDxTop) > 1e-6) {
                var tShoulder = (backMidTop.x - point1a.x) / shoulderDxTop;
                if (tShoulder >= 0 && tShoulder <= 1) {
                    var shoulderY = point1a.y + shoulderDyTop * tShoulder;
                    point38Candidate = {
                        x: backMidTop.x,
                        y: shoulderY
                    };
                }
            } else if (Math.abs(backMidTop.x - point1a.x) < 1e-6) {
                var shoulderMinY = Math.min(point1a.y, backShoulderEnd.y);
                var shoulderMaxY = Math.max(point1a.y, backShoulderEnd.y);
                var clampedY = Math.max(shoulderMinY, Math.min(shoulderMaxY, backMidTop.y));
                point38Candidate = {
                    x: backMidTop.x,
                    y: clampedY
                };
            }
        }
        if (!point38Candidate) {
            point38Candidate = {
                x: backMidTop.x,
                y: dartApex.y
            };
        }
        point38 = point38Candidate;
        placeFrameMarker([point38.x, point38.y], '38');
        var rotatedPoint16ForCurve = null;
        if (dartsLinesGroup && point38 && point16 && backShoulderEnd && point35 && point36 && point37) {
            try {
                var existingBackReleaseCopies = dartsLinesGroup.pathItems;
                for (var relCopyIdx = existingBackReleaseCopies.length - 1; relCopyIdx >= 0; relCopyIdx--) {
                    var backReleaseCandidate = existingBackReleaseCopies[relCopyIdx];
                    if (!backReleaseCandidate) continue;
                    var backReleaseName = '';
                    try {
                        backReleaseName = backReleaseCandidate.name;
                    } catch (eBackReleaseName) {}
                    if (backReleaseName === 'Back Armhole Dart Release Solid') {
                        try {
                            backReleaseCandidate.remove();
                        } catch (eBackReleaseRemove) {}
                    }
                }
            } catch (eBackReleaseSweep) {}
            var rotatedPoint38 = point38;
            var rotatedPoint16 = point16;
            var rotatedBackShoulderEnd = backShoulderEnd;
            var rotatedPoint35 = point35;
            try {
                var baseVec = {
                    x: point35.x - point37.x,
                    y: point35.y - point37.y
                };
                var targetVec = {
                    x: point36.x - point37.x,
                    y: point36.y - point37.y
                };
                var baseLen = Math.sqrt((baseVec.x * baseVec.x) + (baseVec.y * baseVec.y));
                var targetLen = Math.sqrt((targetVec.x * targetVec.x) + (targetVec.y * targetVec.y));
                if (baseLen > 1e-6 && targetLen > 1e-6) {
                    var dotVal = (baseVec.x * targetVec.x) + (baseVec.y * targetVec.y);
                    var detVal = (baseVec.x * targetVec.y) - (baseVec.y * targetVec.x);
                    var rotateAngle = Math.atan2(detVal, dotVal);
                    var cosAngle = Math.cos(rotateAngle);
                    var sinAngle = Math.sin(rotateAngle);
                    var rotateAroundPoint37 = function(pt) {
                        if (!pt) return null;
                        var dx = pt.x - point37.x;
                        var dy = pt.y - point37.y;
                        return {
                            x: point37.x + dx * cosAngle - dy * sinAngle,
                            y: point37.y + dx * sinAngle + dy * cosAngle
                        };
                    };
                    rotatedPoint38 = rotateAroundPoint37(point38) || point38;
                    rotatedPoint16 = rotateAroundPoint37(point16) || point16;
                    rotatedBackShoulderEnd = rotateAroundPoint37(backShoulderEnd) || backShoulderEnd;
                    rotatedPoint35 = rotateAroundPoint37(point35) || point35;
                }
            } catch (eRotateBackSolid) {
                rotatedPoint38 = point38;
                rotatedPoint16 = point16;
                rotatedBackShoulderEnd = backShoulderEnd;
                rotatedPoint35 = point35;
            }
            if (point36) {
                rotatedPoint35 = {
                    x: point36.x,
                    y: point36.y
                };
            }
            rotatedPoint16ForCurve = rotatedPoint16;
            try {
                var backReleaseCopy = dartsLinesGroup.pathItems.add();
                backReleaseCopy.name = 'Back Armhole Dart Release Solid';
                backReleaseCopy.stroked = true;
                backReleaseCopy.strokeWidth = 1;
                backReleaseCopy.strokeColor = DART_TRIANGLE_COLOR;
                backReleaseCopy.filled = false;
                backReleaseCopy.closed = true;
                backReleaseCopy.setEntirePath([
                    toArt(rotatedPoint38),
                    toArt(rotatedPoint16),
                    toArt(rotatedBackShoulderEnd),
                    toArt(rotatedPoint35),
                    toArt(point37),
                    toArt(rotatedPoint38)
                ]);
                try {
                    var releasePts = backReleaseCopy.pathPoints;
                    if (releasePts && releasePts.length >= 2) {
                        var topLeftInfo = null;
                        for (var relIdx = 0; relIdx < releasePts.length; relIdx++) {
                            if (releasePts.length > 2 && relIdx === releasePts.length - 1) continue;
                            var candidatePt = releasePts[relIdx];
                            if (!candidatePt) continue;
                            var anchor = candidatePt.anchor;
                            if (!anchor || anchor.length < 2) continue;
                            var patternAnchor = fromArt(anchor);
                            if (!patternAnchor) continue;
                            if (!topLeftInfo ||
                                patternAnchor.x < topLeftInfo.pattern.x - 1e-6 ||
                                (Math.abs(patternAnchor.x - topLeftInfo.pattern.x) <= 1e-6 && patternAnchor.y > topLeftInfo.pattern.y)) {
                                topLeftInfo = {
                                    point: candidatePt,
                                    anchor: anchor,
                                    pattern: patternAnchor
                                };
                            }
                        }
                        if (topLeftInfo && topLeftInfo.point) {
                            var anchorCorner = topLeftInfo.anchor;
                            try {
                                topLeftInfo.point.pointType = PointType.CORNER;
                                topLeftInfo.point.leftDirection = [anchorCorner[0], anchorCorner[1]];
                                topLeftInfo.point.rightDirection = [anchorCorner[0], anchorCorner[1]];
                            } catch (eBackReleaseCornerSet) {}
                            rotatedPoint16ForCurve = {
                                x: topLeftInfo.pattern.x,
                                y: topLeftInfo.pattern.y
                            };
                        }
                    }
            } catch (eBackReleaseCorner) {}
        } catch (eBackReleaseCopy) {}
    }
        removeTextByName(labelsGroup, 'Label a');
        pointA = null;
        combinedBackShoulderDartDrawn = false;
        var basePointA = null;
        if (point38 && point37) {
            basePointA = pointAlongLineByDistance(point38, point37, 10);
        }
        var releasePathItem = getPathByName(dartsLinesGroup || linesGroup, 'Back Armhole Dart Release Solid');
        if (basePointA) {
            var adjustedPointA = basePointA;
            if (releasePathItem) {
                var intersectionPoint = horizontalIntersectionToLeft(releasePathItem, basePointA);
                if (intersectionPoint) {
                    adjustedPointA = {
                        x: (basePointA.x + intersectionPoint.x) / 2,
                        y: (basePointA.y + intersectionPoint.y) / 2
                    };
                }
            }
            pointA = adjustedPointA;
            if (labelsGroup && pointA) {
                var letterAFrame = labelsGroup.textFrames.add();
                letterAFrame.contents = 'a';
                try {
                    letterAFrame.name = 'Label a';
                } catch (eALabelName) {}
                try {
                    letterAFrame.textRange.characterAttributes.size = NUMBER_FONT_SIZE_PT;
                } catch (eASize) {}
                try {
                    letterAFrame.textRange.characterAttributes.fillColor = makeRGB(0, 0, 0);
                } catch (eAColor) {}
                try {
                    letterAFrame.textRange.characterAttributes.textFont = app.textFonts.getByName('ArialMT');
                } catch (eAFont) {}
                centerTextFrame(letterAFrame, toArt(pointA));
            }
        }
        var releaseTopRightPoint = releasePathItem ? findTopRightPointOnPath(releasePathItem) : null;
        if (releaseTopRightPoint && pointA && point38) {
            var combinedPath = drawCombinedBackShoulderDart(releaseTopRightPoint, pointA, point38);
            if (combinedPath) {
                combinedBackShoulderDartDrawn = true;
                var targetGroupForLines = dartsLinesGroup || linesGroup;
                removePathByName(targetGroupForLines, 'Back Armhole Dart Line (35-37)');
                removePathByName(targetGroupForLines, 'Back Armhole Dart Line (36-37)');
            }
        } else {
            var dartCleanupGroup = dartsLinesGroup || linesGroup;
            removePathByName(dartCleanupGroup, 'Back Shoulder Dart Combined');
        }
        var baseConnectorGroup = dartsLinesGroup || linesGroup;
        if (baseConnectorGroup) {
            removePathByName(baseConnectorGroup, 'Back Shoulder Dart Base');
            if (point37 && point35) {
                var baseLine = drawFrameLine([point37.x, point37.y], [point35.x, point35.y], 'Back Shoulder Dart Base', DART_TRIANGLE_COLOR, baseConnectorGroup);
                if (baseLine) {
                    try {
                        baseLine.strokeDashes = [];
                    } catch (eBaseLineDash) {}
                }
            }
        }
        if (!combinedBackShoulderDartDrawn && dartsLinesGroup && point35 && point37) {
            var backDartTie1 = drawFrameLine([point35.x, point35.y], [point37.x, point37.y], 'Back Armhole Dart Line (35-37)', DART_TRIANGLE_COLOR, dartsLinesGroup);
            if (backDartTie1) {
                try { backDartTie1.strokeDashes = []; } catch (eBackDartLine1) {}
            }
        }
        if (!combinedBackShoulderDartDrawn && dartsLinesGroup && point36 && point37) {
            var backDartTie2 = drawFrameLine([point36.x, point36.y], [point37.x, point37.y], 'Back Armhole Dart Line (36-37)', DART_TRIANGLE_COLOR, dartsLinesGroup);
            if (backDartTie2) {
                try { backDartTie2.strokeDashes = []; } catch (eBackDartLine2) {}
            }
        }
        if (backWaistMidLine) {
            try {
                backWaistMidLine.strokeDashes = DASH_PATTERN;
            } catch (eBackMidDash) {}
        }
    }
    var backSideLinePath = drawLineWithLabel({
        x: point11.x,
        y: point10.y
    }, {
        x: point11.x,
        y: hemLineY
    }, 'Back Side Line', FRAME_COLOR);
    if (backSideLinePath) {
        try {
            backSideLinePath.strokeDashes = DASH_PATTERN;
        } catch (eDashBackSide) {}
    }
    if (linesGroup && point36 && point11 && point10) {
        try {
            var existingBackShapeCurves = linesGroup.pathItems;
            for (var backCurveIdx = existingBackShapeCurves.length - 1; backCurveIdx >= 0; backCurveIdx--) {
                var backCurveCandidate = existingBackShapeCurves[backCurveIdx];
                if (!backCurveCandidate) continue;
                var backCurveName = '';
                try {
                    backCurveName = backCurveCandidate.name;
                } catch (eBackCurveName) {}
                if (backCurveName === 'Back Armhole Curve (36-11)' ||
                    backCurveName === 'Back Armhole Curve (B-36)' ||
                    backCurveName === 'Back Armhole Curve (B-36-11)') {
                    try {
                        backCurveCandidate.remove();
                    } catch (eBackCurveRemove) {}
                }
            }
        } catch (eBackCurveSweep) {}
        var startHandle36 = {
            x: point36.x,
            y: point36.y + 4.1
        };
        var handle11 = null;
        var vec1110 = {
            x: point10.x - point11.x,
            y: point10.y - point11.y
        };
        var len1110 = Math.sqrt((vec1110.x * vec1110.x) + (vec1110.y * vec1110.y));
        if (len1110 > 1e-6) {
            var scaleHandle = 3.6 / len1110;
            handle11 = {
                x: point11.x + vec1110.x * scaleHandle,
                y: point11.y + vec1110.y * scaleHandle
            };
        } else {
            handle11 = {
                x: point11.x + 3.6,
                y: point11.y
            };
        }
        if (rotatedPoint16ForCurve) {
            var handle36Control = {
                x: point36.x + 0.1,
                y: point36.y - 4.8
            };
            try {
                var combinedPath = linesGroup.pathItems.add();
                combinedPath.name = 'Back Armhole Curve (B-36-11)';
                combinedPath.stroked = true;
                combinedPath.strokeWidth = 1;
                combinedPath.strokeColor = FRAME_COLOR;
                combinedPath.filled = false;
                combinedPath.closed = false;
                var startAnchorB = toArt(rotatedPoint16ForCurve);
                var midAnchor = toArt(point36);
                var endAnchor = toArt(point11);
                combinedPath.setEntirePath([startAnchorB, midAnchor, endAnchor]);
                var combinedPts = combinedPath.pathPoints;
                if (combinedPts.length === 3) {
                    var combinedStart = combinedPts[0];
                    combinedStart.pointType = PointType.CORNER;
                    combinedStart.leftDirection = [startAnchorB[0], startAnchorB[1]];
                    combinedStart.rightDirection = [startAnchorB[0], startAnchorB[1]];
                    var combinedMid = combinedPts[1];
                    combinedMid.pointType = PointType.SMOOTH;
                    var handle36Left = toArt(handle36Control);
                    var handle36Right = toArt(startHandle36);
                    combinedMid.leftDirection = [handle36Left[0], handle36Left[1]];
                    combinedMid.rightDirection = [handle36Right[0], handle36Right[1]];
                    var combinedEnd = combinedPts[2];
                    combinedEnd.pointType = PointType.SMOOTH;
                    var handle11Art = toArt(handle11);
                    combinedEnd.leftDirection = [handle11Art[0], handle11Art[1]];
                    combinedEnd.rightDirection = [endAnchor[0], endAnchor[1]];
                }
            } catch (eCombinedCurve) {}
        } else {
            try {
                var backArmholeCurve = linesGroup.pathItems.add();
                backArmholeCurve.name = 'Back Armhole Curve (36-11)';
                backArmholeCurve.stroked = true;
                backArmholeCurve.strokeWidth = 1;
                backArmholeCurve.strokeColor = FRAME_COLOR;
                backArmholeCurve.filled = false;
                backArmholeCurve.closed = false;
                var startAnchor36 = toArt(point36);
                var endAnchor11 = toArt(point11);
                backArmholeCurve.setEntirePath([startAnchor36, endAnchor11]);
                var curvePts = backArmholeCurve.pathPoints;
                if (curvePts.length === 2) {
                    var startPointCurve = curvePts[0];
                    startPointCurve.pointType = PointType.SMOOTH;
                    startPointCurve.leftDirection = [startAnchor36[0], startAnchor36[1]];
                    startPointCurve.rightDirection = toArt(startHandle36);
                    var endPointCurve = curvePts[1];
                    endPointCurve.pointType = PointType.SMOOTH;
                    endPointCurve.leftDirection = toArt(handle11);
                    endPointCurve.rightDirection = [endAnchor11[0], endAnchor11[1]];
                }
            } catch (eBackCurveCreate) {}
        }
    }
    var frontSideLinePath = drawLineWithLabel({
        x: point12.x,
        y: point12.y
    }, {
        x: point12.x,
        y: hemLineY
    }, 'Front Side Line', FRAME_COLOR);
    if (frontSideLinePath) {
        try {
            frontSideLinePath.strokeDashes = DASH_PATTERN;
        } catch (eDashFrontSide) {}
    }
    var waistMarkerLengthCm = 4;
    var waistMarkerHalfLength = waistMarkerLengthCm / 2;
    var frontWaistDartLeftPoint = null;
    var frontWaistDartRightPoint = null;
    var frontWaistDartWidth = 0;
    var waistMarkerPoints = {};
    function addWaistMarker(basePoint, offsetCm, label, lengthOverrideCm) {
        if (!basePoint) return;
        var markerPoint = {
            x: basePoint.x,
            y: basePoint.y - offsetCm
        };
        placeFrameMarker([markerPoint.x, markerPoint.y], label);
        if (label != null) {
            waistMarkerPoints[String(label)] = markerPoint;
        }
        var markerLength = (typeof lengthOverrideCm === 'number' && !isNaN(lengthOverrideCm)) ? lengthOverrideCm : waistMarkerLengthCm;
        var markerHalfLength = markerLength / 2;
        var leftPoint = {
            x: markerPoint.x - markerHalfLength,
            y: markerPoint.y
        };
        var rightPoint = {
            x: markerPoint.x + markerHalfLength,
            y: markerPoint.y
        };
        var dashLine = drawFrameLine(leftPoint, rightPoint, null, DART_TRIANGLE_COLOR);
        if (dashLine) {
            try {
                dashLine.strokeDashes = DASH_PATTERN;
            } catch (eDashLine) {}
        }
    }
    addWaistMarker(point11 ? {
        x: point11.x,
        y: waistLineY
    } : null, 1, '39');
    addWaistMarker(point12 ? {
        x: point12.x,
        y: waistLineY
    } : null, 1, '40');
    addWaistMarker(point10 ? {
        x: point10.x,
        y: waistLineY
    } : null, 0.5, '41', 6);
    if (point13 && point14) {
        var waistQuarterValue = null;
        var waistUserValue = (measurementResults && typeof measurementResults['WaC'] === 'number' && !isNaN(measurementResults['WaC'])) ? measurementResults['WaC'] : null;
        if (waistUserValue === null && rowRefs && rowRefs['WaC'] && rowRefs['WaC'].measField) {
            waistUserValue = parseField(rowRefs['WaC'].measField, defaults.WaC);
        }
        if (waistUserValue !== null && !isNaN(waistUserValue)) waistQuarterValue = waistUserValue / 4;
        if (waistQuarterValue !== null) {
            var waistDirection = (point14.x >= point13.x) ? 1 : -1;
            var point42X = point13.x + waistQuarterValue * waistDirection;
            if (waistDirection > 0 && point42X > point14.x) point42X = point14.x;
            if (waistDirection < 0 && point42X < point14.x) point42X = point14.x;
            point42 = {
                x: point42X,
                y: waistLineY
            };
            placeFrameMarker([point42.x, point42.y], '42');
        }
    }
    var frontDartWaistIntersection = null;
    if (point22) {
        frontDartWaistIntersection = {
            x: point22.x,
            y: waistLineY
        };
    }
    var hiGapValue = 0;
        if (point19 && point42 && frontDartWaistIntersection) {
            var waistDistance19To42 = Math.abs(point19.x - point42.x);
            var frontWaistDartTotal = waistDistance19To42 + frontWaistDartAddition;
            if (frontWaistDartTotal > 0) {
                var halfFrontWaistDart = frontWaistDartTotal / 2;
            frontWaistDartLeftPoint = {
                x: frontDartWaistIntersection.x - halfFrontWaistDart,
                y: waistLineY
            };
            frontWaistDartRightPoint = {
                x: frontDartWaistIntersection.x + halfFrontWaistDart,
                y: waistLineY
            };
            var frontWaistTargetGroup = dartsLinesGroup || linesGroup;
            if (frontWaistTargetGroup) {
                drawFrameLine(frontWaistDartLeftPoint, point22, 'Front Waist Dart Left Leg', DART_TRIANGLE_COLOR, frontWaistTargetGroup);
                drawFrameLine(frontWaistDartRightPoint, point22, 'Front Waist Dart Right Leg', DART_TRIANGLE_COLOR, frontWaistTargetGroup);
            }
            if (markersGroup && numbersGroup) {
                removePathByName(markersGroup, 'Marker FWDL');
                removeTextByName(numbersGroup, 'Marker FWDL Number');
                removePathByName(markersGroup, 'Marker FWDR');
                removeTextByName(numbersGroup, 'Marker FWDR Number');
                placeFrameMarker([frontWaistDartLeftPoint.x, frontWaistDartLeftPoint.y], 'FWDL');
                placeFrameMarker([frontWaistDartRightPoint.x, frontWaistDartRightPoint.y], 'FWDR');
            }
            frontWaistDartWidth = Math.abs(frontWaistDartRightPoint.x - frontWaistDartLeftPoint.x);
        } else {
            frontWaistDartWidth = 0;
            if (markersGroup && numbersGroup) {
                removePathByName(markersGroup, 'Marker FWDL');
                removeTextByName(numbersGroup, 'Marker FWDL Number');
                removePathByName(markersGroup, 'Marker FWDR');
                removeTextByName(numbersGroup, 'Marker FWDR Number');
            }
        }
        hiGapValue = frontWaistDartTotal - 2;
        if (hiGapValue < 0) hiGapValue = 0;
    }
    if (!frontWaistDartLeftPoint || !frontWaistDartRightPoint) {
        if (markersGroup && numbersGroup) {
            removePathByName(markersGroup, 'Marker FWDL');
            removeTextByName(numbersGroup, 'Marker FWDL Number');
            removePathByName(markersGroup, 'Marker FWDR');
            removeTextByName(numbersGroup, 'Marker FWDR Number');
        }
    }
    measurementResults.HiGap = hiGapValue;
    easeResults.HiGap = 0;
    finalResults.HiGap = hiGapValue;

    var frontHipSpan = null;
    if (point12 && point14) {
        frontHipSpan = Math.abs(point14.x - point12.x);
        if (typeof hiGapValue === 'number' && hiGapValue > 0) {
            frontHipSpan = Math.max(0, frontHipSpan - hiGapValue);
        }
    }
    var centreBackHipPoint = null;
    if (typeof extendLineToY === 'function' && point2 && point8) {
        centreBackHipPoint = extendLineToY(point2, point8, hipLineY);
    }
    var backHipSpan = null;
    if (centreBackHipPoint && point11) {
        backHipSpan = Math.abs(point11.x - centreBackHipPoint.x);
    }
    var hiGValue = 0;
    if (frontHipSpan !== null && backHipSpan !== null) {
        hiGValue = frontHipSpan + backHipSpan;
    }
    measurementResults.HiG = hiGValue;
    easeResults.HiG = 0;
    finalResults.HiG = hiGValue;

    var hiwValue = 0;
    if (latestDerived && typeof latestDerived.hiw === 'number') {
        hiwValue = latestDerived.hiw;
    } else if (rowRefs && rowRefs['HiC'] && rowRefs['HiC'].finalField) {
        var hiFinalValue = parseField(rowRefs['HiC'].finalField, defaults.HiC);
        if (!isNaN(hiFinalValue)) hiwValue = hiFinalValue / 2;
    }
    var hiDiff = hiGValue - hiwValue;
    var hiDiffHalf = Math.abs(hiDiff) / 2;
    var epsilonHiGap = 0.001;

    removePathByName(markersGroup, 'Marker 44');
    removeTextByName(numbersGroup, 'Marker 44 Number');
    removePathByName(markersGroup, 'Marker 45');
    removeTextByName(numbersGroup, 'Marker 45 Number');
    removePathByName(linesGroup, 'Front HiG Line');
    removePathByName(linesGroup, 'Back HiG Line');

    if (hiDiffHalf > epsilonHiGap && point12 && point14 && point11 && centreBackHipPoint) {
        var frontHipMarker = {
            x: point12.x + hiDiffHalf,
            y: hipLineY
        };
        var backHipMarker = {
            x: point11.x - hiDiffHalf,
            y: hipLineY
        };
        placeFrameMarker([frontHipMarker.x, frontHipMarker.y], '44');
        placeFrameMarker([backHipMarker.x, backHipMarker.y], '45');
        drawFrameLine(frontHipMarker, {
            x: frontHipMarker.x,
            y: hemLineY
        }, 'Front HiG Line', DART_TRIANGLE_COLOR);
        drawFrameLine(backHipMarker, {
            x: backHipMarker.x,
            y: hemLineY
        }, 'Back HiG Line', DART_TRIANGLE_COLOR);
        removePathByName(linesGroup, 'Front Hip Curve');
        removePathByName(linesGroup, 'Back Hip Curve');
        if (linesGroup && marker40 && frontHipMarker) {
            var frontHipCurve = linesGroup.pathItems.add();
            frontHipCurve.name = 'Front Hip Curve';
            frontHipCurve.stroked = true;
            frontHipCurve.strokeWidth = 1;
            frontHipCurve.strokeColor = DART_TRIANGLE_COLOR;
            frontHipCurve.filled = false;
            frontHipCurve.closed = false;
            var frontStartArt = toArt(marker40);
            var frontEndArt = toArt(frontHipMarker);
            frontHipCurve.setEntirePath([frontStartArt, frontEndArt]);
            var fhPts = frontHipCurve.pathPoints;
            if (fhPts.length === 2) {
                var fhStart = fhPts[0];
                var fhEnd = fhPts[1];
                fhStart.pointType = PointType.SMOOTH;
                fhEnd.pointType = PointType.SMOOTH;
                fhStart.leftDirection = [frontStartArt[0], frontStartArt[1]];
                fhEnd.rightDirection = [frontEndArt[0], frontEndArt[1]];
                var dxFront = frontEndArt[0] - frontStartArt[0];
                var handleFront = Math.abs(dxFront) * 0.4;
                fhStart.rightDirection = [frontStartArt[0] + handleFront, frontStartArt[1]];
                fhEnd.leftDirection = [frontEndArt[0] - handleFront, frontEndArt[1]];
            }
        }
        if (linesGroup && marker39 && backHipMarker) {
            var backHipCurve = linesGroup.pathItems.add();
            backHipCurve.name = 'Back Hip Curve';
            backHipCurve.stroked = true;
            backHipCurve.strokeWidth = 1;
            backHipCurve.strokeColor = DART_TRIANGLE_COLOR;
            backHipCurve.filled = false;
            backHipCurve.closed = false;
            var backStartArt = toArt(marker39);
            var backEndArt = toArt(backHipMarker);
            backHipCurve.setEntirePath([backStartArt, backEndArt]);
            var bhPts = backHipCurve.pathPoints;
            if (bhPts.length === 2) {
                var bhEnd = bhPts[1];
                if (bhEnd) {
                    try {
                        bhEnd.pointType = PointType.SMOOTH;
                        var anchor = bhEnd.anchor;
                        var dxBack = backEndArt[0] - backStartArt[0];
                        var dyBack = backEndArt[1] - backStartArt[1];
                        var vecLen = Math.sqrt((dxBack * dxBack) + (dyBack * dyBack));
                        if (vecLen < 1e-6) {
                            dxBack = 1;
                            dyBack = 0;
                            vecLen = 1;
                        }
                        var handleLen = vecLen * 0.4;
                        var minHandleLen = cm(MIN_HANDLE_LENGTH_CM);
                        if (handleLen < minHandleLen) handleLen = minHandleLen;
                        var ux = dxBack / vecLen;
                        var uy = dyBack / vecLen;
                        var leftHandle = [anchor[0] - ux * handleLen, anchor[1] - uy * handleLen];
                        var rightHandle = [anchor[0] + ux * handleLen, anchor[1] + uy * handleLen];
                        bhEnd.leftDirection = leftHandle;
                        bhEnd.rightDirection = rightHandle;
                    } catch (eBackHipSmooth) {}
                }
            }
        }
        var hiGapConnectorGroup = dartsLinesGroup || linesGroup;
        if (hiGapConnectorGroup && frontWaistDartLeftPoint && frontWaistDartRightPoint && hiLeftStart && hiRightStart) {
            drawFrameLine(frontWaistDartLeftPoint, hiLeftStart, 'Front Waist Dart Left to HiGap', DART_TRIANGLE_COLOR, hiGapConnectorGroup);
            drawFrameLine(frontWaistDartRightPoint, hiRightStart, 'Front Waist Dart Right to HiGap', DART_TRIANGLE_COLOR, hiGapConnectorGroup);
        } else {
            removePathByName(hiGapConnectorGroup, 'Front Waist Dart Left to HiGap');
            removePathByName(hiGapConnectorGroup, 'Front Waist Dart Right to HiGap');
        }
    }
    if (frontDartWaistIntersection) {
        var frontDartLengthPoint = {
            x: frontDartWaistIntersection.x,
            y: shiftDown(frontDartWaistIntersection.y, frontDartLengthValue)
        };
        removePathByName(markersGroup, 'Front Dart Length Marker');
        removeTextByName(numbersGroup, 'Front Dart Length Label');
        removePathByName(linesGroup, 'Front Dart Length Line');
        var frontLengthMarker = placeFrameMarker(frontDartLengthPoint, null);
        if (frontLengthMarker) {
            try {
                frontLengthMarker.name = 'Front Dart Length Marker';
            } catch (eFrontMarkerName) {}
        }
        if (numbersGroup) {
            try {
                var frontLengthLabel = numbersGroup.textFrames.add();
                frontLengthLabel.contents = '43';
                try {
                    frontLengthLabel.name = 'Front Dart Length Label';
                } catch (eFrontLabelName) {}
                frontLengthLabel.textRange.characterAttributes.size = NUMBER_FONT_SIZE_PT;
                frontLengthLabel.textRange.characterAttributes.fillColor = NUMBER_FILL_COLOR;
                try {
                    frontLengthLabel.textRange.characterAttributes.textFont = app.textFonts.getByName('ArialMT');
                } catch (eFrontLengthFont) {}
                try {
                    frontLengthLabel.textRange.paragraphAttributes.justification = Justification.CENTER;
                } catch (eFrontLengthJust) {}
                try {
                    frontLengthLabel.textRange.characterAttributes.baselineShift = 0;
                } catch (eFrontLengthShift) {}
                centerTextFrame(frontLengthLabel, toArt(frontDartLengthPoint));
            } catch (eFrontLengthLabel) {}
        }
            var frontLengthLeft = {
                x: frontDartLengthPoint.x - 3,
                y: frontDartLengthPoint.y
            };
            var frontLengthRight = {
                x: frontDartLengthPoint.x + 3,
                y: frontDartLengthPoint.y
            };
            var frontLengthLine = drawFrameLine(frontLengthLeft, frontLengthRight, null, DART_TRIANGLE_COLOR);
            if (frontLengthLine) {
                try {
                    frontLengthLine.name = 'Front Dart Length Line';
                } catch (eFrontLengthLineName) {}
                try {
                    frontLengthLine.strokeDashes = DASH_PATTERN;
                } catch (eFrontLengthDash) {}
            }
        var hiGapHalf = (hiGapValue || 0) / 2;
        var epsilonHi = 0.001;
        if (hiGapHalf > epsilonHi) {
            var hiLeftStart = {
                x: frontDartLengthPoint.x - hiGapHalf,
                y: frontDartLengthPoint.y
            };
            var hiRightStart = {
                x: frontDartLengthPoint.x + hiGapHalf,
                y: frontDartLengthPoint.y
            };
            var hiLeftEnd = {
                x: hiLeftStart.x,
                y: hemLineY
            };
            var hiRightEnd = {
                x: hiRightStart.x,
                y: hemLineY
            };
            drawFrameLine(hiLeftStart, hiLeftEnd, 'Front HiGap Left', DART_TRIANGLE_COLOR);
            drawFrameLine(hiRightStart, hiRightEnd, 'Front HiGap Right', DART_TRIANGLE_COLOR);
            if (markersGroup && numbersGroup && typeof hipLineY === 'number') {
                removePathByName(markersGroup, 'Marker HGL');
                removeTextByName(numbersGroup, 'Marker HGL Number');
                removePathByName(markersGroup, 'Marker HGR');
                removeTextByName(numbersGroup, 'Marker HGR Number');
                placeFrameMarker([hiLeftStart.x, hipLineY], 'HGL');
                placeFrameMarker([hiRightStart.x, hipLineY], 'HGR');
            }
            var dartConnectorGroup = dartsLinesGroup || linesGroup;
            if (dartConnectorGroup) {
                if (frontWaistDartLeftPoint) {
                    var leftLegPath = getPathByName(dartConnectorGroup, 'Front Waist Dart Left Leg');
                    prependPointToPath(leftLegPath, hiLeftStart);
                }
                if (frontWaistDartRightPoint) {
                    var rightLegPath = getPathByName(dartConnectorGroup, 'Front Waist Dart Right Leg');
                    prependPointToPath(rightLegPath, hiRightStart);
                }
            }
        } else {
            removePathByName(linesGroup, 'Front HiGap Left');
            removePathByName(linesGroup, 'Front HiGap Right');
            if (markersGroup && numbersGroup) {
                removePathByName(markersGroup, 'Marker HGL');
                removeTextByName(numbersGroup, 'Marker HGL Number');
                removePathByName(markersGroup, 'Marker HGR');
                removeTextByName(numbersGroup, 'Marker HGR Number');
            }
        }
    } else {
        removePathByName(markersGroup, 'Front Dart Length Marker');
        removeTextByName(numbersGroup, 'Front Dart Length Label');
        removePathByName(linesGroup, 'Front Dart Length Line');
        removePathByName(linesGroup, 'Front HiGap Left');
        removePathByName(linesGroup, 'Front HiGap Right');
        if (markersGroup && numbersGroup) {
            removePathByName(markersGroup, 'Marker HGL');
            removeTextByName(numbersGroup, 'Marker HGL Number');
            removePathByName(markersGroup, 'Marker HGR');
            removeTextByName(numbersGroup, 'Marker HGR Number');
        }
    }
    if (markersGroup && numbersGroup) {
        removePathByName(markersGroup, 'Marker HCB');
        removeTextByName(numbersGroup, 'Marker HCB Number');
        if (point7 && point8 && typeof hipLineY === 'number') {
            var hipCbContoured = extendLineToY(point7, point8, hipLineY);
            if (hipCbContoured) {
                placeFrameMarker([hipCbContoured.x, hipCbContoured.y], 'HCB');
            }
        }
    }

    function clampValue(value, min, max) {
        var result = value;
        if (min !== undefined && min !== null && result < min) result = min;
        if (max !== undefined && max !== null && result > max) result = max;
        return result;
    }

    function shiftDown(baseY, length) {
        if (!length || length <= 0) return baseY;
        var target = baseY + length;
        if (typeof hemLineY === 'number' && target > hemLineY) target = hemLineY;
        return target;
    }

    function removePathByName(container, name) {
        if (!container || !name || !container.pathItems) return;
        try {
            var items = container.pathItems;
            for (var i = items.length - 1; i >= 0; i--) {
                var item = items[i];
                if (!item) continue;
                var itemName = '';
                try {
                    itemName = item.name;
                } catch (eReadName) {}
                if (itemName === name) {
                    try {
                        item.remove();
                    } catch (eRemoveItem) {}
                }
            }
        } catch (eRemoveGroup) {}
    }

    function getPathByName(container, name) {
        if (!container || !name || !container.pathItems) return null;
        try {
            var items = container.pathItems;
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                if (!item) continue;
                try {
                    if (item.name === name) return item;
                } catch (eReadPathName) {}
            }
        } catch (eGetPath) {}
        return null;
    }

    function removeTextByName(container, name) {
        if (!container || !name || !container.textFrames) return;
        try {
            var items = container.textFrames;
            for (var i = items.length - 1; i >= 0; i--) {
                var item = items[i];
                if (!item) continue;
                var itemName = '';
                try {
                    itemName = item.name;
                } catch (eReadTextName) {}
                if (itemName === name) {
                    try {
                        item.remove();
                    } catch (eRemoveText) {}
                }
            }
        } catch (eRemoveTextGroup) {}
    }

    function prependPointToPath(pathItem, patternPoint) {
        if (!pathItem || !patternPoint) return;
        var artPoint = toArt(patternPoint);
        var existingPoints = [];
        try {
            var pts = pathItem.pathPoints;
            if (!pts || pts.length === 0) return;
            var alreadyPrepended = false;
            if (pts.length > 0) {
                var firstAnchor = pts[0].anchor;
                if (firstAnchor && Math.abs(firstAnchor[0] - artPoint[0]) < 0.001 && Math.abs(firstAnchor[1] - artPoint[1]) < 0.001) {
                    alreadyPrepended = true;
                }
            }
            if (alreadyPrepended) return;
            existingPoints.push(artPoint);
            for (var i = 0; i < pts.length; i++) {
                var anchor = pts[i].anchor;
                if (anchor) existingPoints.push([anchor[0], anchor[1]]);
            }
            pathItem.setEntirePath(existingPoints);
        } catch (ePrependPath) {}
    }

    function horizontalIntersectionToLeft(pathItem, referencePoint) {
        if (!pathItem || !referencePoint) return null;
        var bestPoint = null;
        try {
            var pts = pathItem.pathPoints;
            if (!pts || pts.length === 0) return null;
            for (var i = 0; i < pts.length; i++) {
                var currentAnchor = pts[i] ? fromArt(pts[i].anchor) : null;
                var nextAnchor = pts[(i + 1) % pts.length] ? fromArt(pts[(i + 1) % pts.length].anchor) : null;
                if (!currentAnchor || !nextAnchor) continue;
                var intersect = intersectSegmentWithHorizontal(currentAnchor, nextAnchor, referencePoint.y);
                if (!intersect) continue;
                if (intersect.x <= referencePoint.x + 1e-6) {
                    if (!bestPoint || intersect.x > bestPoint.x) {
                        bestPoint = intersect;
                    }
                }
            }
        } catch (eHorizontalIntersect) {}
        return bestPoint;
    }

    function intersectSegmentWithHorizontal(p1, p2, targetY) {
        if (!p1 || !p2) return null;
        var epsilon = 1e-6;
        var minY = Math.min(p1.y, p2.y);
        var maxY = Math.max(p1.y, p2.y);
        if (targetY < minY - epsilon || targetY > maxY + epsilon) {
            if (Math.abs(targetY - minY) > epsilon || Math.abs(targetY - maxY) > epsilon) {
                return null;
            }
        }
        var dy = p2.y - p1.y;
        var dx = p2.x - p1.x;
        if (Math.abs(dy) < epsilon) {
            if (Math.abs(targetY - p1.y) > epsilon) return null;
            var rangeMin = Math.min(p1.x, p2.x);
            var rangeMax = Math.max(p1.x, p2.x);
            return {
                x: rangeMax,
                y: targetY
            };
        }
        var t = (targetY - p1.y) / dy;
        if (t < -epsilon || t > 1 + epsilon) return null;
        if (t < 0) t = 0;
        if (t > 1) t = 1;
        return {
            x: p1.x + dx * t,
            y: targetY
        };
    }

    function findTopRightPointOnPath(pathItem) {
        if (!pathItem) return null;
        var topRight = null;
        var epsilon = 1e-6;
        try {
            var pts = pathItem.pathPoints;
            if (!pts || pts.length === 0) return null;
            for (var i = 0; i < pts.length; i++) {
                var anchor = pts[i] ? fromArt(pts[i].anchor) : null;
                if (!anchor) continue;
                if (!topRight ||
                    anchor.y < topRight.y - epsilon ||
                    (Math.abs(anchor.y - topRight.y) <= epsilon && anchor.x > topRight.x + epsilon)) {
                    topRight = {
                        x: anchor.x,
                        y: anchor.y
                    };
                }
            }
        } catch (eTopRight) {}
        return topRight;
    }

    function drawCombinedBackShoulderDart(topPoint, apexPoint, lowerPoint) {
        var targetGroup = dartsLinesGroup || linesGroup;
        if (!targetGroup || !topPoint || !apexPoint || !lowerPoint) return null;
        removePathByName(targetGroup, 'Back Shoulder Dart Combined');
        var dartPath = targetGroup.pathItems.add();
        dartPath.name = 'Back Shoulder Dart Combined';
        dartPath.stroked = true;
        dartPath.strokeWidth = 1;
        dartPath.strokeColor = DART_TRIANGLE_COLOR;
        dartPath.filled = false;
        dartPath.closed = false;
        dartPath.setEntirePath([toArt(topPoint), toArt(apexPoint), toArt(lowerPoint)]);
        try {
            dartPath.strokeDashes = DASH_PATTERN;
        } catch (eCombinedDashes) {}
        return dartPath;
    }

    function ensureWaistDart(namePrefix, basePoint, apexPoint, leftWidth, rightWidth, drawCenter, options) {
        if (!dartsLinesGroup && !linesGroup) return;
        var targetGroup = dartsLinesGroup || linesGroup;
        if (!targetGroup || !basePoint || !apexPoint) {
            removePathByName(targetGroup, namePrefix + ' Centre');
            removePathByName(targetGroup, namePrefix + ' Left');
            removePathByName(targetGroup, namePrefix + ' Right');
            return;
        }
        options = options || {};
        var leftExtendPoint = options.leftExtendPoint;
        var rightExtendPoint = options.rightExtendPoint;
        var epsilon = 0.001;
        var leftVal = Math.max(leftWidth || 0, 0);
        var rightVal = Math.max(rightWidth || 0, 0);
        var shouldDrawCenter = (drawCenter !== false);
        if (leftVal <= epsilon && rightVal <= epsilon) {
            if (!shouldDrawCenter) {
                removePathByName(targetGroup, namePrefix + ' Centre');
            }
            removePathByName(targetGroup, namePrefix + ' Left');
            removePathByName(targetGroup, namePrefix + ' Right');
            return;
        }
        if (shouldDrawCenter) {
            drawFrameLine(basePoint, apexPoint, namePrefix + ' Centre', DART_TRIANGLE_COLOR, targetGroup);
        } else {
            removePathByName(targetGroup, namePrefix + ' Centre');
        }
        if (leftVal > epsilon) {
            var leftStart = {
                x: basePoint.x - leftVal,
                y: basePoint.y
            };
            var leftPath = drawFrameLine(leftStart, apexPoint, namePrefix + ' Left', DART_TRIANGLE_COLOR, targetGroup);
            if (leftPath && leftExtendPoint && typeof leftExtendPoint.x === 'number' && typeof leftExtendPoint.y === 'number') {
                var leftPathPoints = [toArt(leftStart), toArt(apexPoint)];
                leftPathPoints.unshift(toArt(leftExtendPoint));
                leftPath.setEntirePath(leftPathPoints);
                try {
                    var leftPtsCollection = leftPath.pathPoints;
                    if (leftPtsCollection && leftPtsCollection.length > 0) {
                        var leftExtensionPoint = leftPtsCollection[0];
                        if (leftExtensionPoint) {
                            leftExtensionPoint.pointType = PointType.SMOOTH;
                            var leftAnchorArt = leftExtensionPoint.anchor;
                            if (leftAnchorArt && leftAnchorArt.length >= 2) {
                                var leftAnchor = fromArt(leftAnchorArt);
                                var leftHandlePattern = {
                                    x: leftAnchor.x,
                                    y: leftAnchor.y - 5.35
                                };
                                var leftHandleArt = toArt(leftHandlePattern);
                                leftExtensionPoint.leftDirection = leftHandleArt;
                                leftExtensionPoint.rightDirection = leftHandleArt;
                            }
                        }
                    }
                } catch (eLeftSmooth) {}
            }
        } else {
            removePathByName(targetGroup, namePrefix + ' Left');
        }
        if (rightVal > epsilon) {
            var rightStart = {
                x: basePoint.x + rightVal,
                y: basePoint.y
            };
            var rightPath = drawFrameLine(rightStart, apexPoint, namePrefix + ' Right', DART_TRIANGLE_COLOR, targetGroup);
            if (rightPath && rightExtendPoint && typeof rightExtendPoint.x === 'number' && typeof rightExtendPoint.y === 'number') {
                var rightPathPoints = [toArt(rightStart), toArt(apexPoint)];
                rightPathPoints.unshift(toArt(rightExtendPoint));
                rightPath.setEntirePath(rightPathPoints);
                try {
                    var rightPtsCollection = rightPath.pathPoints;
                    if (rightPtsCollection && rightPtsCollection.length > 0) {
                        var extensionPoint = rightPtsCollection[0];
                        if (extensionPoint) {
                            extensionPoint.pointType = PointType.SMOOTH;
                            var anchorPt = extensionPoint.anchor;
                            if (anchorPt) {
                                var anchorPattern = fromArt(anchorPt);
                                var rightHandlePattern = {
                                    x: anchorPattern.x,
                                    y: anchorPattern.y - 5.35
                                };
                                var rightHandleArt = toArt(rightHandlePattern);
                                extensionPoint.rightDirection = rightHandleArt;
                                extensionPoint.leftDirection = rightHandleArt;
                            }
                        }
                    }
                } catch (eRightSmooth) {}
            }
        } else {
            removePathByName(targetGroup, namePrefix + ' Right');
        }
    }

    var frontWaistGap = null;
    if (point12 && point14) {
        var frontWidth = Math.abs(point14.x - point12.x);
        frontWaistGap = frontWidth - frontWaistDartWidth;
        if (frontWaistGap < 0) frontWaistGap = 0;
    }
    var backWaistGap = null;
    if (point7 && point11) {
        backWaistGap = Math.abs(point11.x - point7.x);
    }
    var waistGapTotal = null;
    if (frontWaistGap !== null && backWaistGap !== null) {
        waistGapTotal = frontWaistGap + backWaistGap;
    }
    var waistWidth = null;
    if (latestDerived && typeof latestDerived.waw === 'number') {
        waistWidth = latestDerived.waw;
    } else if (rowRefs && rowRefs['WaC'] && rowRefs['WaC'].finalField) {
        var waFinalValue = parseField(rowRefs['WaC'].finalField, defaults.WaC);
        if (!isNaN(waFinalValue)) waistWidth = waFinalValue / 2;
    }
    if (waistWidth === null) waistWidth = 0;
    var waistDifference = null;
    if (waistGapTotal !== null) {
        waistDifference = waistGapTotal - waistWidth;
    }
    if (waistDifference === null) waistDifference = 0;
    if (waistDifference < 0) waistDifference = 0;

    var totalWaistDistribution = waistDifference;
    var sideShareTotal = 0;
    var backArmShare = 0;
    var backDartShare = 0;
    if (totalWaistDistribution > 0) {
        var remainingShare = totalWaistDistribution;
        sideShareTotal = clampValue(totalWaistDistribution * 0.3, 0, 2);
        if (sideShareTotal > remainingShare) sideShareTotal = remainingShare;
        remainingShare -= sideShareTotal;

        backArmShare = clampValue(totalWaistDistribution * 0.3, 0, 3);
        if (backArmShare > remainingShare) backArmShare = remainingShare;
        remainingShare -= backArmShare;

        backDartShare = clampValue(remainingShare, 0, 4);
        remainingShare -= backDartShare;

        if (remainingShare > 0) {
            var sideRoom = 2 - sideShareTotal;
            if (sideRoom > 0) {
                var addSide = Math.min(sideRoom, remainingShare);
                sideShareTotal += addSide;
                remainingShare -= addSide;
            }
        }
        if (remainingShare > 0) {
            var backArmRoom = 3 - backArmShare;
            if (backArmRoom > 0) {
                var addArm = Math.min(backArmRoom, remainingShare);
                backArmShare += addArm;
                remainingShare -= addArm;
            }
        }
        if (remainingShare > 0) {
            var backDartRoom = 4 - backDartShare;
            if (backDartRoom > 0) {
                var addDart = Math.min(backDartRoom, remainingShare);
                backDartShare += addDart;
                remainingShare -= addDart;
            }
        }
    }

    var sideShareEach = sideShareTotal / 2;
    var backArmHalfShare = backArmShare / 2;
    var backDartHalfShare = backDartShare / 2;

    var bustIntersectionY = bustLineStart ? bustLineStart.y : bustLineY;
    var waistDartGroup = dartsLinesGroup || linesGroup;
    if (waistDartGroup) {
        var marker40 = waistMarkerPoints['40'] || waistMarkerPoints[40];
        if (marker40 || point12) {
            var frontSideBase = marker40 ? { x: marker40.x, y: marker40.y } : { x: point12.x, y: waistLineY };
            var frontSideApex = {
                x: frontSideBase.x,
                y: bustIntersectionY
            };
            ensureWaistDart('Waist Dart Front Side', frontSideBase, frontSideApex, sideShareEach, 0, false, {
                leftExtendPoint: frontHipMarker
            });
        }
        var marker39 = waistMarkerPoints['39'] || waistMarkerPoints[39];
        if (marker39 || point11) {
            var backSideBase = marker39 ? { x: marker39.x, y: marker39.y } : { x: point11.x, y: waistLineY };
            var backSideApex = {
                x: backSideBase.x,
                y: bustIntersectionY
            };
            ensureWaistDart('Waist Dart Back Side', backSideBase, backSideApex, 0, sideShareEach, false, {
                rightExtendPoint: backHipMarker
            });
        }
        var marker41 = waistMarkerPoints['41'] || waistMarkerPoints[41];
        if (marker41 || point10) {
            var backArmBasePoint = marker41 ? { x: marker41.x, y: marker41.y } : { x: point10.x, y: waistLineY };
            var backArmApexPoint = {
                x: backArmBasePoint.x,
                y: (point10 ? point10.y : bustIntersectionY)
            };
            ensureWaistDart('Waist Dart Back Arm', backArmBasePoint, backArmApexPoint, backArmHalfShare, backArmHalfShare, true);
            var epsilonBackArm = 0.001;
            if (backArmHalfShare > epsilonBackArm) {
                var backArmDownApex = {
                    x: backArmBasePoint.x,
                    y: shiftDown(backArmBasePoint.y, secondBackDartLengthValue)
                };
                var backArmLeftStart = {
                    x: backArmBasePoint.x - backArmHalfShare,
                    y: backArmBasePoint.y
                };
                var backArmRightStart = {
                    x: backArmBasePoint.x + backArmHalfShare,
                    y: backArmBasePoint.y
                };
                drawFrameLine(backArmLeftStart, backArmDownApex, 'Back Arm Dart Down Left', DART_TRIANGLE_COLOR, waistDartGroup);
                drawFrameLine(backArmRightStart, backArmDownApex, 'Back Arm Dart Down Right', DART_TRIANGLE_COLOR, waistDartGroup);
            } else {
                removePathByName(waistDartGroup, 'Back Arm Dart Down Left');
                removePathByName(waistDartGroup, 'Back Arm Dart Down Right');
            }
        } else {
            removePathByName(waistDartGroup, 'Back Arm Dart Down Left');
            removePathByName(waistDartGroup, 'Back Arm Dart Down Right');
        }
        if (backWaistMidpoint) {
            var backDartBasePoint = {
                x: backWaistMidpoint.x,
                y: waistLineY
            };
            var backDartApexPoint = {
                x: backWaistMidpoint.x,
                y: bustIntersectionY
            };
            ensureWaistDart('Waist Dart Back Mid', backDartBasePoint, backDartApexPoint, backDartHalfShare, backDartHalfShare, true);
            var epsilonBackDart = 0.001;
            if (backDartHalfShare > epsilonBackDart) {
                var backDartDownApex = {
                    x: backWaistMidpoint.x,
                    y: shiftDown(backWaistMidpoint.y, mainBackDartLengthValue)
                };
                var backDartLeftStart = {
                    x: backWaistMidpoint.x - backDartHalfShare,
                    y: waistLineY
                };
                var backDartRightStart = {
                    x: backWaistMidpoint.x + backDartHalfShare,
                    y: waistLineY
                };
                drawFrameLine(backDartLeftStart, backDartDownApex, 'Back Main Dart Down Left', DART_TRIANGLE_COLOR, waistDartGroup);
                drawFrameLine(backDartRightStart, backDartDownApex, 'Back Main Dart Down Right', DART_TRIANGLE_COLOR, waistDartGroup);
            } else {
                removePathByName(waistDartGroup, 'Back Main Dart Down Left');
                removePathByName(waistDartGroup, 'Back Main Dart Down Right');
            }
        } else {
            removePathByName(waistDartGroup, 'Waist Dart Back Mid Centre');
            removePathByName(waistDartGroup, 'Waist Dart Back Mid Left');
            removePathByName(waistDartGroup, 'Waist Dart Back Mid Right');
            removePathByName(waistDartGroup, 'Back Main Dart Down Left');
            removePathByName(waistDartGroup, 'Back Main Dart Down Right');
        }

    }

    if (!latestDerived) latestDerived = {};
    latestDerived.frontWaistGap = frontWaistGap;
    latestDerived.backWaistGap = backWaistGap;
    latestDerived.waistGapTotal = waistGapTotal;
    latestDerived.waW = waistWidth;
    latestDerived.waistDifference = waistDifference;
    latestDerived.waistSideShare = sideShareTotal;
    latestDerived.waistBackArmShare = backArmShare;
    latestDerived.waistBackDartShare = backDartShare;
    latestDerived.frontDartLength = frontDartLengthValue;
    latestDerived.mainBackDartLength = mainBackDartLengthValue;
    latestDerived.secondBackDartLength = secondBackDartLengthValue;
    latestDerived.hiG = hiGValue;
    latestDerived.hiDiff = hiDiff;

    var frontArmLineTopY = topLineY + 8;
    if (frontArmLineTopY > waistLineY) frontArmLineTopY = waistLineY;
    var frontArmLineStart = {
        x: point13.x,
        y: frontArmLineTopY
    };
    var frontArmLineEnd = {
        x: point13.x,
        y: waistLineY
    };
    var frontArmLinePath = drawLineWithLabel(frontArmLineStart, frontArmLineEnd, 'Front Arm Line', FRAME_COLOR);
    if (frontArmLinePath) {
        try {
            frontArmLinePath.strokeDashes = DASH_PATTERN;
        } catch (eDashFrontArm) {}
    }
    var frontDartLinePath = drawLineWithLabel(frontDartTop, frontDartBottom, 'Front Dart Line', FRAME_COLOR);
    try {
        frontDartLinePath.strokeDashes = DASH_PATTERN;
    } catch (eDashDart) {}
    drawLineWithLabel({
        x: point14.x,
        y: point20.y
    }, {
        x: point14.x,
        y: hemLineY
    }, 'Centre Front (CF)', FRAME_COLOR);
    drawLineWithLabel(hemLineStart, hemEnd, 'Hem Line', FRAME_COLOR);
    var baseArtboardIndex = doc.artboards.getActiveArtboardIndex();
    if (shouldShowMeasurementPalette) {
        showMeasurementPaletteWindow(selectedProfile ? selectedProfile.name : '');
    } else {
        closeMeasurementPalette();
        generateMeasurementReference();
    }
    cropArtboardAroundItems(baseArtboardIndex, [linesGroup, markersGroup, numbersGroup, labelsGroup], 10);
    var bustLinePath = drawLineWithLabel(bustLineStart, bustEnd, 'Bust Line', FRAME_COLOR);
    try {
        bustLinePath.strokeDashes = DASH_PATTERN;
    } catch (eDashBust) {}
    var waistLinePath = drawLineWithLabel(waistLineStart, waistEnd, 'Waist Line', FRAME_COLOR);
    try {
        waistLinePath.strokeDashes = DASH_PATTERN;
    } catch (eDashWaist) {}
    var hipLinePath = drawLineWithLabel(hipLineStart, hipEnd, 'Hip Line', FRAME_COLOR);
    try {
        hipLinePath.strokeDashes = DASH_PATTERN;
    } catch (eDashHip) {}
    if (!$.global.guidoBodiceFrame) $.global.guidoBodiceFrame = {};
    $.global.guidoBodiceFrame.originCm = {
        x: 0,
        y: 0
    };
    $.global.guidoBodiceFrame.extentsCm = {
        left: (artboardRect[0] - originX) / cm(1),
        right: rightBoundaryCm,
        top: topBoundaryCm,
        bottom: (artboardRect[3] - originY) / cm(1)
    };
    $.global.guidoBodiceFrame.helpers = {
        drawFrameLine: drawFrameLine,
        drawCurve: drawCurveBetween,
        placeFrameMarker: placeFrameMarker,
        drawLabel: drawCenteredLabel
    };
    $.global.guidoBodiceFrame.points = {
        p1: point1,
        p1a: point1a,
        p1aExtension: point1aExtension,
        p2: point2,
        p3: point3,
        p4: point4,
        p5: point5,
        p6: point6,
        p6a: point6a,
        p7: point7,
        p8: point8,
        p9: point9,
        p10: point10,
        p11: point11,
        p12: point12,
        p13: point13,
        p13a: point13a,
        p14: point14,
        point19: point19,
        point20: point20,
        point20a: point20a,
        point21: point21,
        point22: point22,
        point23: point23,
        point24: point24,
        frontDartTop: frontDartTop,
        point31: point31,
        frontDartBottom: frontDartBottom,
        point32: point32,
        point32Top: point32Top,
        point33: point33,
        point34: backWaistMidpoint,
        point35: point35,
        point36: point36,
        point37: point37,
        point38: point38,
        pointA: pointA,
        point42: point42,
        hemEnd: hemEnd,
        bustEnd: bustEnd,
        waistEnd: waistEnd,
        hipEnd: hipEnd,
        frontShoulderEnd: frontShoulderEnd,
        backShoulderEnd: backShoulderEnd,
        p16: point16,
        p17: point17,
        p17a: point17a,
        p18: point18
    };
    $.global.guidoBodiceFrame.activePoints = {
        bust: point9,
        waist: point7,
        hem: point8
    };
    $.global.guidoBodiceFrame.measurements = {
        measurements: measurementResults,
        ease: easeResults,
        constructed: finalResults,
        BL: BL,
        BLBal: BLBal,
        BLFinal: BLFinal,
        NeG: NeG,
        AGPlus: AGPlus,
        BGPlus: BGPlus,
        BrGPlus: BrGPlus,
        BrD: BrDValue,
        centreFrontX: point14.x,
        backArmBase: backArmBase,
        backArmLineX: point10.x,
        MoL: MoL,
        HiD: HiD,
        BackContour: BackContour,
        backContourAuto: backContourAuto,
        BackShoulderDartIntake: backShoulderDartIntake,
        fitProfile: selectedProfile.name,
        shoulderDifference: shoulderDifference,
        frontShoulderAngle: frontShoulderAngle,
        backShoulderAngle: backShoulderAngle,
        fShS: fShSValue,
        bShS: bShS,
        frontShoulderDartRotation: frontShoulderDartRotation
    };

    function drawCasualFrontArmhole() {
        if (!point24 || !point12 || !point13a || !point14) return;

        var casualLayer = ensureLayer('Armhole Curves');
        try {
            casualLayer.locked = false;
        } catch (eCasLockFront) {}
        try {
            casualLayer.visible = true;
        } catch (eCasVisFront) {}
        var casualStroke = makeRGB(0, 0, 0);

        var frontGroup = resetGroup(casualLayer, 'Front Armhole Curve');
        clearGroupDeep(frontGroup);

        function makeVector(a, b) {
            return {
                x: b.x - a.x,
                y: b.y - a.y
            };
        }

        function addVec(pt, vec) {
            return {
                x: pt.x + vec.x,
                y: pt.y + vec.y
            };
        }

        function magnitude(v) {
            return Math.sqrt((v.x * v.x) + (v.y * v.y));
        }

        function normalizeVec(v) {
            var len = magnitude(v);
            if (len < 1e-6) return {
                x: 0,
                y: 0
            };
            return {
                x: v.x / len,
                y: v.y / len
            };
        }

        function scaleVec(v, scalar) {
            return {
                x: v.x * scalar,
                y: v.y * scalar
            };
        }

        function bezierPoint(t, p0, p1, p2, p3) {
            var mt = 1 - t;
            var mt2 = mt * mt;
            var t2 = t * t;
            var a = mt2 * mt;
            var b = 3 * mt2 * t;
            var c = 3 * mt * t2;
            var d = t * t2;
            return {
                x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
                y: a * p0.y + b * p1.y + c * p2.y + d * p3.y
            };
        }

        function bezierDerivative(t, p0, p1, p2, p3) {
            var mt = 1 - t;
            return {
                x: 3 * mt * mt * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
                y: 3 * mt * mt * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y)
            };
        }

        var shoulderTip = point24;
        var bustPoint = point12;
        var guidePoint = point13a;
        var shoulderBase = point20a ? point20a : shoulderTip;

        var dir1214 = makeVector(bustPoint, point14);
        var dir1214Len = magnitude(dir1214);
        if (dir1214Len < 1e-6) return;
        var dir1214Norm = normalizeVec(dir1214);

        var shoulderVector = makeVector(shoulderBase, shoulderTip);
        var bustVector = makeVector(shoulderTip, bustPoint);

        var perp = {
            x: -shoulderVector.y,
            y: shoulderVector.x
        };
        if (magnitude(perp) < 1e-6) perp = {
            x: -bustVector.y,
            y: bustVector.x
        };
        if ((perp.x * (guidePoint.x - shoulderTip.x)) + (perp.y * (guidePoint.y - shoulderTip.y)) < 0) {
            perp.x *= -1;
            perp.y *= -1;
        }
        perp = normalizeVec(perp);

        var shoulderHandleLen = Math.max(magnitude(bustVector) * 0.45, 1.2);
        var shoulderHandle = scaleVec(perp, shoulderHandleLen);

        var handleLen = dir1214Len * 0.5;
        if (handleLen < 0.5) handleLen = 0.5;
        var tSolve = 0.5;

        var p0 = shoulderTip;
        var p1 = addVec(shoulderTip, shoulderHandle);
        var p3 = bustPoint;

        for (var iter = 0; iter < 25; iter++) {
            var p2 = addVec(p3, scaleVec(dir1214Norm, handleLen));
            var current = bezierPoint(tSolve, p0, p1, p2, p3);
            var diff = {
                x: current.x - guidePoint.x,
                y: current.y - guidePoint.y
            };
            if (Math.abs(diff.x) < 0.0005 && Math.abs(diff.y) < 0.0005) break;

            var dBdt = bezierDerivative(tSolve, p0, p1, p2, p3);
            var coeff = 3 * (1 - tSolve) * tSolve * tSolve;
            var dBdL = scaleVec(dir1214Norm, coeff);
            var det = (dBdt.x * dBdL.y) - (dBdt.y * dBdL.x);
            if (Math.abs(det) < 1e-6) break;

            var deltaT = (-diff.x * dBdL.y + dBdL.x * diff.y) / det;
            var deltaL = (-dBdt.x * diff.y + dBdt.y * diff.x) / det;
            tSolve += deltaT;
            handleLen += deltaL;
            if (tSolve < 0.05) tSolve = 0.05;
            if (tSolve > 0.95) tSolve = 0.95;
            if (handleLen < 0.05) handleLen = 0.05;
        }

        var shoulderAnchor = toArt(p0);
        var bustAnchor = toArt(p3);
        var handleStartAnchor = toArt(addVec(p0, shoulderHandle));
        var handleEndAnchor = toArt(addVec(p3, scaleVec(dir1214Norm, handleLen)));

        var path = frontGroup.pathItems.add();
        path.name = 'Front Armhole Curve';
        path.stroked = true;
        path.strokeWidth = 1;
        path.strokeColor = casualStroke;
        path.filled = false;
        path.closed = false;
        path.setEntirePath([shoulderAnchor, bustAnchor]);

        var pts = path.pathPoints;
        if (pts.length === 2) {
            var startPt = pts[0];
            startPt.pointType = PointType.SMOOTH;
            startPt.leftDirection = shoulderAnchor;
            startPt.rightDirection = handleStartAnchor;

            var endPt = pts[1];
            endPt.pointType = PointType.SMOOTH;
            endPt.leftDirection = handleEndAnchor;
            endPt.rightDirection = bustAnchor;
        }
    }

    function drawCasualBackArmhole() {
        if (!backShoulderEnd || !point17 || !point17a || !point11 || !point4) return;

        var casualLayer = ensureLayer('Armhole Curves');
        try {
            casualLayer.locked = false;
        } catch (eCasLockBack) {}
        try {
            casualLayer.visible = true;
        } catch (eCasVisBack) {}
        var casualStroke = makeRGB(0, 0, 0);

        var backGroup = resetGroup(casualLayer, 'Back Armhole Curve');
        clearGroupDeep(backGroup);

        function makeVector(a, b) {
            return {
                x: b.x - a.x,
                y: b.y - a.y
            };
        }

        function addVec(pt, vec) {
            return {
                x: pt.x + vec.x,
                y: pt.y + vec.y
            };
        }

        function magnitude(v) {
            return Math.sqrt((v.x * v.x) + (v.y * v.y));
        }

        function normalizeVec(v) {
            var len = magnitude(v);
            if (len < 1e-6) return {
                x: 0,
                y: 0
            };
            return {
                x: v.x / len,
                y: v.y / len
            };
        }

        function scaleVec(v, scalar) {
            return {
                x: v.x * scalar,
                y: v.y * scalar
            };
        }

        function bezierPoint(p0, p1, p2, p3, t) {
            var mt = 1 - t;
            var mt2 = mt * mt;
            var t2 = t * t;
            var a = mt2 * mt;
            var b = 3 * mt2 * t;
            var c = 3 * mt * t2;
            var d = t * t2;
            return {
                x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
                y: a * p0.y + b * p1.y + c * p2.y + d * p3.y
            };
        }

        function bezierDerivative(p0, p1, p2, p3, t) {
            var mt = 1 - t;
            return {
                x: 3 * mt * mt * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
                y: 3 * mt * mt * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y)
            };
        }

        var startAnchor = backShoulderEnd;
        var midAnchor = point17;
        var guidePoint = point17a;
        var endAnchor = point11;
        var guideLinePoint = point4;

        var startToMid = makeVector(startAnchor, midAnchor);
        var startLen = magnitude(startToMid);
        if (startLen < 1e-6) return;
        var startDir = normalizeVec(startToMid);
        var startHandleLen = Math.min(startLen * 0.35, 5);
        if (startHandleLen < 0.5) startHandleLen = 0.5;
        var startHandle = addVec(startAnchor, scaleVec(startDir, startHandleLen));
        var verticalDrop = guidePoint ? Math.abs(guidePoint.y - midAnchor.y) : 5;
        if (verticalDrop < 0.5) verticalDrop = 0.5;
        var midDown = {
            x: midAnchor.x,
            y: midAnchor.y + verticalDrop
        };
        var midOutgoingHandle = {
            x: guidePoint ? guidePoint.x + 1 : midDown.x,
            y: midDown.y
        };
        var midIncomingHandle = {
            x: midAnchor.x - (midOutgoingHandle.x - midAnchor.x),
            y: midAnchor.y - (midOutgoingHandle.y - midAnchor.y)
        };

        var lineDir = makeVector(endAnchor, guideLinePoint);
        var lineDirLen = magnitude(lineDir);
        if (lineDirLen < 1e-6) lineDir = makeVector(endAnchor, midAnchor);
        lineDir = normalizeVec(lineDir);

        var handleLenEnd = magnitude(makeVector(endAnchor, guidePoint || endAnchor));
        if (handleLenEnd < 0.5) handleLenEnd = 0.5;

        var tSolve = 0.5;
        var p0 = midAnchor;
        var p1 = midOutgoingHandle;
        var p3 = endAnchor;

        for (var iter = 0; iter < 30; iter++) {
            var p2 = addVec(p3, scaleVec(lineDir, handleLenEnd));
            var target = guidePoint || midAnchor;
            var current = bezierPoint(p0, p1, p2, p3, tSolve);
            var diff = {
                x: current.x - target.x,
                y: current.y - target.y
            };
            if (Math.abs(diff.x) < 0.0003 && Math.abs(diff.y) < 0.0003) break;

            var dBdt = bezierDerivative(p0, p1, p2, p3, tSolve);
            var coeff = 3 * (1 - tSolve) * tSolve * tSolve;
            var dBdL = scaleVec(lineDir, coeff);
            var det = (dBdt.x * dBdL.y) - (dBdt.y * dBdL.x);
            if (Math.abs(det) < 1e-8) break;

            var deltaT = (-diff.x * dBdL.y + dBdL.x * diff.y) / det;
            var deltaL = (-dBdt.x * diff.y + dBdt.y * diff.x) / det;
            tSolve += deltaT;
            handleLenEnd += deltaL;
            if (tSolve < 0.05) tSolve = 0.05;
            if (tSolve > 0.95) tSolve = 0.95;
            if (handleLenEnd < 0.05) handleLenEnd = 0.05;
        }

        var endLeftHandle = addVec(endAnchor, scaleVec(lineDir, handleLenEnd));

        var shoulderPath = backGroup.pathItems.add();
        shoulderPath.name = 'Back Armhole Curve (Shoulder-17)';
        shoulderPath.stroked = true;
        shoulderPath.strokeWidth = 1;
        shoulderPath.strokeColor = casualStroke;
        shoulderPath.filled = false;
        shoulderPath.closed = false;
        shoulderPath.setEntirePath([toArt(startAnchor), toArt(midAnchor)]);

        var pts1 = shoulderPath.pathPoints;
        if (pts1.length === 2) {
            var shoulderStart = pts1[0];
            shoulderStart.pointType = PointType.SMOOTH;
            shoulderStart.leftDirection = toArt(startAnchor);
            shoulderStart.rightDirection = toArt(startHandle);

            var shoulderEnd = pts1[1];
            shoulderEnd.pointType = PointType.SMOOTH;
            shoulderEnd.leftDirection = toArt(midIncomingHandle);
            shoulderEnd.rightDirection = toArt(midOutgoingHandle);
        }

        var waistPath = backGroup.pathItems.add();
        waistPath.name = 'Back Armhole Curve (17-11)';
        waistPath.stroked = true;
        waistPath.strokeWidth = 1;
        waistPath.strokeColor = casualStroke;
        waistPath.filled = false;
        waistPath.closed = false;
        waistPath.setEntirePath([toArt(midAnchor), toArt(endAnchor)]);

        var pts2 = waistPath.pathPoints;
        if (pts2.length === 2) {
            var waistStart = pts2[0];
            waistStart.pointType = PointType.SMOOTH;
            waistStart.leftDirection = toArt(midIncomingHandle);
            waistStart.rightDirection = toArt(midOutgoingHandle);

            var waistEnd = pts2[1];
            waistEnd.pointType = PointType.SMOOTH;
            waistEnd.leftDirection = toArt(endLeftHandle);
            waistEnd.rightDirection = toArt(endAnchor);
        }
    }

    drawCasualFrontArmhole();
    drawCasualBackArmhole();

    if (armholeLayer) {
        try {
            armholeLayer.visible = false;
        } catch (eArmHideFinal) {}
    }

    try {
        app.executeMenuCommand('fitin');
    } catch (eFit) {}
})();

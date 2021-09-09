const { assign } = lodash;
const { createHigherOrderComponent } = wp.compose;
const { Fragment } = wp.element;
const { InspectorControls } = wp.blockEditor;
const { PanelBody, SelectControl, CheckboxControl, ToggleControl, Text } = wp.components;
const { addFilter } = wp.hooks;
const { __ } = wp.i18n;

const enableLightboxOnBlocks = ['core/gallery', 'core/image'];

const THEME_CONTROL_OPTIONS = [{
  label: __('Light'),
  value: 'light'
}, {
  label: __('Dark'),
  value: 'dark'
}];

/**
 * Add lightbox attributes to block.
 *
 * @param {object} settings Current block settings.
 * @param {string} name Name of block.
 *
 * @returns {object} Modified block settings.
 */
const addLightboxAttributes = (settings, name) => {
  // Early exit if block is not supported.
  if (!enableLightboxOnBlocks.includes(name)) {
    return settings;
  }

  settings.attributes = assign(settings.attributes, {
    lightboxEnabled: {
      type: 'boolean',
      default: true
    },
    theme: {
      type: 'string',
      default: THEME_CONTROL_OPTIONS[0].value
    },
    showTitle: {
      type: 'boolean',
      default: true
    },
    showCaption: {
      type: 'boolean',
      default: true
    },
    showExif: {
      type: 'boolean',
      default: true
    },
    showFileInfo: {
      type: 'boolean',
      default: true
    },
    showKeywords: {
      type: 'boolean',
      default: true
    },
    showGps: {
      type: 'boolean',
      default: true
    },
    keepSeparate: {
      type: 'boolean',
      default: false
    }
  });

  return settings;
};

addFilter('blocks.registerBlockType', 'block-editor-options/attribute/lightbox', addLightboxAttributes);

/**
 * Create HOC to add lightbox options to inspector controls of the block.
 */
const addLightboxControls = createHigherOrderComponent(BlockEdit => {
  return props => {
    // Early exit if block type is not supported.
    if (!enableLightboxOnBlocks.includes(props.name)) {
      return React.createElement(BlockEdit, props);
    }

    const { lightboxEnabled } = props.attributes;
    const { theme } = props.attributes;
    const { showTitle } = props.attributes;
    const { showCaption } = props.attributes;
    const { showExif } = props.attributes;
    const { showFileInfo } = props.attributes;
    const { showKeywords } = props.attributes;
    const { showGps } = props.attributes;
    const { keepSeparate } = props.attributes;

    // Add class to block. This is used only in the editor, in cases where the preview needs to change based on attribute.
    if (lightboxEnabled) {
      props.attributes.className = `lightbox-enabled-${lightboxEnabled}`;
    }

    // For documentation on all controls, see:
    // https://github.com/WordPress/gutenberg/tree/master/packages/components/src
    return React.createElement(
      Fragment,
      null,
      React.createElement(BlockEdit, props),
      React.createElement(
        InspectorControls,
        null,
        React.createElement(
          PanelBody,
          {
            title: __('Lightbox Options'),
            initialOpen: true
          },
          React.createElement(ToggleControl, {
            label: __('Enabled'),
            help: __('Enables Lightbox for this gallery. If enabled, Lightbox will override links specified above.'),
            checked: lightboxEnabled,
            onChange: lightboxEnabledSelection => {
              props.setAttributes({
                lightboxEnabled: lightboxEnabledSelection
              })
            }
          }),
          lightboxEnabled &&
          React.createElement(Fragment, null,
            React.createElement(SelectControl, {
              label: __('Theme'),
              value: theme,
              options: THEME_CONTROL_OPTIONS,
              onChange: themeSelection => {
                props.setAttributes({
                  theme: themeSelection
                });
              }
            }),
            React.createElement('p', { class: 'acclectic-lightbox-menu-label' },
              __('Show on image overlay if available:')
            ),
            React.createElement(CheckboxControl, {
              label: __('Title'),
              checked: showTitle,
              onChange: showTitleSelection => {
                props.setAttributes({
                  showTitle: showTitleSelection
                });
              }
            }),
            React.createElement(CheckboxControl, {
              label: __('Caption'),
              checked: showCaption,
              onChange: showCaptionSelection => {
                props.setAttributes({
                  showCaption: showCaptionSelection
                });
              }
            }),
            React.createElement('p', { class: 'acclectic-lightbox-menu-label' },
              __('Show in side bar if available:')
            ),
            React.createElement(CheckboxControl, {
              label: __('Photo keywords'),
              checked: showKeywords,
              onChange: showKeywordsSelection => {
                props.setAttributes({
                  showKeywords: showKeywordsSelection
                });
              }
            }),
            React.createElement(CheckboxControl, {
              label: __('EXIF metadata'),
              checked: showExif,
              onChange: showExifSelection => {
                props.setAttributes({
                  showExif: showExifSelection
                });
              }
            }),
            React.createElement(CheckboxControl, {
              label: __('GPS Location'),
              checked: showGps,
              onChange: showGpsSelection => {
                props.setAttributes({
                  showGps: showGpsSelection
                });
              }
            }),
            React.createElement(CheckboxControl, {
              label: __('File information'),
              checked: showFileInfo,
              onChange: showFileInfoSelection => {
                props.setAttributes({
                  showFileInfo: showFileInfoSelection
                });
              }
            }),
            React.createElement(CheckboxControl, {
              label: __('Keep separate'),
              help: __('Keeps this lightbox separate from other lightboxes on this page. By default, all galleries and images with lightboxes enabled share a lightbox.'),
              checked: keepSeparate,
              onChange: keepSeparateSelection => {
                props.setAttributes({
                  keepSeparate: keepSeparateSelection
                });
              }
            }),
          )
        )
      )
    );
  };
}, 'withLightboxControl');

addFilter('editor.BlockEdit', 'block-editor-options/with-lightbox-control', addLightboxControls);

/**
 * Add lightbox attributes to save element of the block.
 *
 * @param {object} saveElementProps Props of save element.
 * @param {Object} blockType Block type information.
 * @param {Object} attributes Attributes of block.
 *
 * @returns {object} Modified props of save element.
 */
const addLightboxProps = (saveElementProps, blockType, attributes) => {
  if (!enableLightboxOnBlocks.includes(blockType.name)) {
    return saveElementProps;
  }

  let lightboxConfig = {};
  lightboxConfig['enabled'] = attributes.lightboxEnabled;
  lightboxConfig['theme'] = attributes.theme;
  lightboxConfig['showTitle'] = attributes.showTitle;
  lightboxConfig['showCaption'] = attributes.showCaption;
  lightboxConfig['showExif'] = attributes.showExif;
  lightboxConfig['showFileInfo'] = attributes.showFileInfo;
  lightboxConfig['showKeywords'] = attributes.showKeywords;
  lightboxConfig['showGps'] = attributes.showGps;

  // Only populate this if set to prevent block editor errors.
  if (attributes.keepSeparate) {
    lightboxConfig['keepSeparate'] = attributes.keepSeparate;
  }

  assign(saveElementProps, {
    'acclectic-lightbox-config': JSON.stringify(lightboxConfig)
  });

  return saveElementProps;
};

addFilter('blocks.getSaveContent.extraProps', 'block-editor-options/get-save-content/extra-props', addLightboxProps);


<?php
namespace AcclecticLightbox;

define('ACCLECTIC_LIGHTBOX_DEBUG_LOG', true);

/**
 * A controller for the Acclectic Lightbox.
 */
class Controller
{

    protected static $instance = null;

    /**
     * Returns the singleton instance of the controller.
     */
    public static function getInstance()
    {
        if (self::$instance == null) {
            self::$instance = new self;
        }
        return self::$instance;
    }

    private function __construct()
    {
        global $wpdb;

        add_action('wp_enqueue_scripts', array($this, 'enqueueStyles'));
        add_action('wp_enqueue_scripts', array($this, 'enqueueScripts'));
        add_action('enqueue_block_editor_assets', array($this, 'enqueueBlockEditorAssets'));
    }

    public function enqueueStyles()
    {
        wp_enqueue_style(
            'acclectic-lightbox-css',
            ACCLECTIC_LIGHTBOX_CSS_URL . 'acclectic-lightbox.css',
            array(),
            ACCLECTIC_LIGHTBOX_PLUGIN_NAME,
            'all');
    }

    public function enqueueScripts()
    {
        wp_register_script(
            'acclectic-lightbox',
            esc_url(ACCLECTIC_LIGHTBOX_JS_URL . 'acclectic-lightbox.js'),
            ['jquery', 'wp-element'],
            ACCLECTIC_LIGHTBOX_PLUGIN_NAME,
            false/* in_footer */);

        wp_register_script(
            'exif-js',
            esc_url(ACCLECTIC_LIGHTBOX_THIRD_PARTY_URL . 'ExifReader/dist/exif-reader.js'),
            [],
            ACCLECTIC_LIGHTBOX_PLUGIN_NAME,
            false/* in_footer */);

        wp_register_script(
            'srcset',
            esc_url(ACCLECTIC_LIGHTBOX_THIRD_PARTY_URL . 'parse-srcset/src//parse-srcset.js'),
            [],
            ACCLECTIC_LIGHTBOX_PLUGIN_NAME,
            false/* in_footer */);

        wp_register_script(
            'hammerjs',
            esc_url(ACCLECTIC_LIGHTBOX_THIRD_PARTY_URL . 'hammerjs/hammer.min.js'),
            [],
            ACCLECTIC_LIGHTBOX_PLUGIN_NAME,
            false/* in_footer */);

        wp_localize_script(
            'acclectic-lightbox',
            'config',
            [
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('ajax-nonce'),
                'basePath' => ACCLECTIC_LIGHTBOX_URL,
                'modulePath' => ACCLECTIC_LIGHTBOX_URL . 'inc',
                'thirdPartyPath' => ACCLECTIC_LIGHTBOX_THIRD_PARTY_URL,
                'assetsPath' => ACCLECTIC_LIGHTBOX_ASSETS_URL,
            ]
        );

        wp_localize_script(
            'acclectic-lightbox',
            'i18n',
            Strings::get()
        );

        wp_enqueue_script('acclectic-lightbox');
        wp_enqueue_script('exif-js');
        wp_enqueue_script('srcset');
        wp_enqueue_script('hammerjs');
    }

    public function enqueueBlockEditorAssets()
    {
        wp_enqueue_script(
            'block-editor-options-js',
            esc_url(ACCLECTIC_LIGHTBOX_JS_URL . 'block-editor-options.js'),
            ['wp-blocks', 'wp-i18n', 'wp-element', 'wp-editor'],
            ACCLECTIC_LIGHTBOX_PLUGIN_NAME,
            true/* in_footer */
        );
    }
}

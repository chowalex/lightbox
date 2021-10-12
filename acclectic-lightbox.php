<?php
/**
 * Plugin Name: Acclectic Lightbox
 * Plugin URI:  https://www.acclectic.com/
 * Description: An EXIF-enabled lightbox that works with native Wordpress images and galleries, with GPS mapping support.
 * Version:     1.6
 * Author:      Acclectic Media
 * Author URI:  https://www.acclectic.com
 * Text Domain: acclectic-lightbox
 * License:     GPL-2.0+
 * License URI: http://www.gnu.org/licenses/gpl-2.0.txt
 * Domain Path: /languages/
 */

namespace AcclecticLightbox;

if (!defined('ABSPATH')) {exit;}

define('ACCLECTIC_LIGHTBOX__FILE__', __FILE__);
define('ACCLECTIC_LIGHTBOX_PATH', plugin_dir_path(ACCLECTIC_LIGHTBOX__FILE__));
define('ACCLECTIC_LIGHTBOX_URL', plugins_url('/', ACCLECTIC_LIGHTBOX__FILE__));

define('ACCLECTIC_LIGHTBOX_TEXT_DOMAIN', 'acclectic-lightbox');
define('ACCLECTIC_LIGHTBOX_PLUGIN_BASE', plugin_basename(ACCLECTIC_LIGHTBOX__FILE__));
define('ACCLECTIC_LIGHTBOX_PLUGIN_NAME', 'AcclecticLightbox');

define('ACCLECTIC_LIGHTBOX_JS_URL', ACCLECTIC_LIGHTBOX_URL . 'js/');
define('ACCLECTIC_LIGHTBOX_CSS_URL', ACCLECTIC_LIGHTBOX_URL . 'css/');
define('ACCLECTIC_LIGHTBOX_ASSETS_URL', ACCLECTIC_LIGHTBOX_URL . 'assets/');
define('ACCLECTIC_LIGHTBOX_THIRD_PARTY_URL', ACCLECTIC_LIGHTBOX_URL . 'third_party/');

function acclectic_init()
{
    include_once ACCLECTIC_LIGHTBOX_PATH . 'inc/plugin.php';

    loadAcclecticTextDomain();
}

function loadAcclecticTextDomain()
{
    $locale = function_exists('determine_locale') ?
    determine_locale() : (is_admin() ? get_user_locale() : get_locale());

    load_textdomain(ACCLECTIC_LIGHTBOX_TEXT_DOMAIN, plugin_dir_path(__FILE__) . 'languages/' . $locale . '.mo');

    // Deprecated.
    load_plugin_textdomain(ACCLECTIC_LIGHTBOX_TEXT_DOMAIN, false, plugin_dir_path(__FILE__) . 'languages/');
}

function activate()
{
}

add_action('plugins_loaded', 'AcclecticLightbox\\acclectic_init');

register_activation_hook(__FILE__, 'AcclecticLightbox\\activate');

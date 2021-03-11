<?php
namespace AcclecticLightbox;

/**
 * Acclectic Lightbox Main Plugin Module
 */
class LightboxPlugin
{

    public function __construct()
    {
        $this->init_files();
    }

    private function init_files()
    {
        include_once ACCLECTIC_LIGHTBOX_PATH . 'inc/strings.php';
        include_once ACCLECTIC_LIGHTBOX_PATH . 'inc/controller.php';

        // Instantiate installed modules.
        Controller::getInstance();
    }
}

new LightboxPlugin();

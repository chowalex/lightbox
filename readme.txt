=== Acclectic Lightbox ===
Contributors: acclectic
Tags: lightbox, gallery, exif, gps, photo gallery, map, mapping, image, photography, photo lightbox, media lightbox
Requires at least: 5.0.0
Tested up to: 5.8.1
Stable tag: 1.6
Version: 1.6
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.en.html
Author: acclectic
Donate link: https://www.acclectic.com/

A configurable lightbox with EXIF and GPS mapping support that works with native Wordpress galleries and images.

== Description ==

Acclectic Lightbox is an advanced and configurable lightbox that displays images and photos in your Wordpress galleries in full screen, complete with file information, camera EXIF metadata, and embedded maps showing photo location. Unlike most existing lightboxes, it supports native Wordpress galleries and images, so it will always work and you need not be dependent on third-party gallery plugins. It is also highly configurable, and gives you control over almost every aspect of the lightbox's look and feel.

== Demo ==

See sample lightboxes in action [here](https://www.acclectic.com/wordpress-lightbox).

== Features ==

**EXIF**
Displays EXIF metadata for each image (if it is available) such as aperture, shutter speed, exposure (and many other tags). You can enable or disable the display of EXIF metadata for each gallery. For a list of all supported EXIF tags, please refer to the plugin's [documentation](https://www.acclectic.com/support/wordpress-lightbox-docs/).

**GPS Mapping**
Displays an embedded map showing the location at which the image was captured, based on GPS coordinates in the image metadata.

**Native gallery and image support**
Unlike most existing lightboxes, the Acclectic Lightbox works with native Wordpress galleries and images. This means that you do *not* need to create a custom gallery (with a third-party gallery plugin) in order to use the lightbox. It also means that the lightbox will always work wth Wordpress, and you are not dependent on third-party gallery plugins.

**Configuration**
You can configure the lightbox directly within the Wordpress block editor. Each image and gallery can have a separate and different configuration.

**Themes**
Choose between a light or dark theme, conveniently within the block editor. Each image and gallery can have a separate theme.

**Slider**
Scroll through every image in the gallery using the built-in slider, controllable by the mouse or keyboard.

**Fullscreen**
Switch between full-screen and normal views with a convenient mouse or key press.

**Slideshow**
The lightbox can scroll through images automatically in slideshow mode.

**Keyboard bindings**
You can control all of the lightbox's features via the mouse or the keyboard. Scroll through images, play or pause the slideshow, or toggle full-screen view with convenient key bindings.

**Responsive design**
Responsive design for seamless rendering in both desktop and mobile environments. Supports swipe gestures.

**Integration across images and galleries**
If you have multiple images or galleries on a post or page, they can share a single lightbox. Or keep them separate via a simple button click.

**File information**
Displays pertinent information about each image, including file size, date/time taken, and date/time modified. You can enable or disable the display of file information for each gallery.

**Title and caption**
Displays the title and caption (if they are available). You can enable or disable the display of title and caption for each gallery.

**Keywords**
Displays the photo keywords (if they are available). You can enable or disable the display of keywords for each gallery.

**Responsive Images**
To improve image load times, the image displayed is chosen from a set of all available images depending on the viewer's screen size.

**Share**
[Beta] Get the full URL of the original image for sharing.

**No Limits**
All supported features are fully available to you with no limits of any kind.

== Screenshots ==

1. The Acclectic Lightbox displaying EXIF metadata and file information.
2. Configure the lightbox for each gallery directly within the Wordpress block editor.
3. Dark theme. Choose between a light or dark theme for each gallery or image.

== Frequently Asked Questions ==

= Are there any limits to this plugin? =
No. All supported features are fully available to you with no limits of any kind.

= Can I disable the lightbox for certain galleries? =
Yes. Each gallery has an individual configuration in the Wordpress block editor, and you can enable or disable the lightbox functionality for each individual gallery.

= Why is EXIF metadata not being displayed even though the option is enabled? =
EXIF metadata is displayed only if it is included in the original image, and the original image can be found by the plugin. WordPress resizes every image that you upload, and resized images typically do not contain EXIF metadata. However, the plugin will attempt to recover EXIF metadata by finding the original image. This works in most cases as long as you have not moved or deleted the original image. If you are certain that your original image exists and it contains EXIF metadata, please file a bug with a link to the images in question and we will do our best to investigate.

== Supported Languages ==

Acclectic Lightbox is available in these languages:

* Chinese (Simplified)
* Chinese (Traditional)
* English
* French
* German
* Italian
* Japanese
* Portuguese
* Polish
* Russian
* Spanish

Note that the EXIF data being displayed will be in the native language in which it was captured.

== Changelog ==

= 1.6 - October 12, 2021 =
- Fixes bug where clicking on any image/gallery after the first (with multiple galleries merged into a single gallery) shows the wrong image.

= 1.5 - September 8, 2021 =
- Add supprt for swipe gestures.
- Add responsive rendering.
- Fix original image name.
- By default, combine all lightboxes on a page. Adds option to keep a lightbox separate.

= 1.4 - July 13, 2021 =
- Do not request original full-size image for EXIF data for performance reasons.
- Strip parameters in src if provided.
- Remove smart galleries from block editor, as configs for smart galleries will now be provided via meta-boxes.

= 1.3 - July 6, 2021 =
- Fixed last-image overflow.
- Added support for custom srcset for smart galleries.

= 1.2 - July 3, 2021 =
- Added support for smart galleries.

= 1.1 - March 25, 2021 = 
- Added GPS mapping support.

= 1.0 - March 13, 2021 = 
- First public release.

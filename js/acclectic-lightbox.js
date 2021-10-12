// Main JS implementation of the Acclectic Lightbox Module.

!function (jq) {

  const LIGHTBOX_CONFIG_ATTR = 'acclectic-lightbox-config';
  const NUM_PRELOAD_NEIGHBORS = 2;
  const SLIDESHOW_MS = 3000;
  const DEFAULT_TITLE = i18n['untitled'];
  const FORCE_GET_EXIF_FROM_ORIGINAL = false;

  const MAP_ZOOM = 16;

  const FULL_SCREEN_EXIT_ICON = 'fullscreen_exit-24px.svg';
  const FULL_SCREEN_ENTER_ICON = 'fullscreen-24px.svg';
  const PAUSE_ICON = 'pause_circle_outline-24px.svg';
  const PLAY_ICON = 'play_circle_outline-24px.svg';
  const SHARE_ICON = 'share-24px.svg';
  const INFO_ICON = 'info-24px.svg';
  const PREV_ICON = 'chevron_left-24px.svg';
  const NEXT_ICON = 'chevron_right-24px.svg';
  const CLOSE_ICON = 'close-24px.svg';

  const LIGHT_COLOR = '#ffffff';
  const DARK_COLOR = '#222222';

  const MAPS_API_KEY = "AIzaSyBg4FTvbbgaM2hfdf0eki0taHQ6UVn4A04";

  // TODO: implement filter.
  const IMAGE_TYPES = /.+\.(gif|jpe?g|png|webp)/i;

  /** A map of all galleries. */
  var galleries = {};

  /**
  gallery = {
    uuid: A string UUID.
    dom: The DOM of the gallery on the original page.
    configJson: A dictionary of config for this gallery.
    images: An array of images. 
  }
  
  image = {
    galleryImgDom: <img> DOM of the image in the original gallery page,
    slideDom: DOM of the image slide of class acclectic-lightbox-slide
    fileInfo: {
      fullPath: Complete URL to the image being shown.
      name: File name of the image being shown.
      nameUnscaled: File name of the original/unscaled image, if available.
    }
    exif: dictionary of EXIF data from ExifReader,
  }
  */

  var currentImageIndex = -1;
  var currentGallery = null;

  var showingInfo = false;

  /** A slideshow timer object, or null if slideshow is not playing. */
  var slideshowTimer;

  // Control buttons. These are wrapped <li> elements.
  var enterFullScreen;
  var play;
  var info;
  var share;

  var globalGallery = {};
  var globalIndex = 0;
  const GLOBAL_GALLERY_UUID = "GLOBAL";

  var controller = {
    init: function () {
      controller.initializeNativeGalleries();
      lightbox.build();
    },

    initializeNativeGalleries: function () {
      let galleryDoms = jq(".wp-block-gallery, .wp-block-image, .acclectic-smart-gallery");
      console.log("Found " + galleryDoms.length + " native galleries.");

      galleryDoms.each((index, value, a) => {
        controller.parseGallery(value);
      });
    },

    parseGallery: function (galleryDom) {
      let config = {};

      try {
        config = JSON.parse(jq(galleryDom).attr(LIGHTBOX_CONFIG_ATTR));
      } catch (e) {
        console.log("Cannot parse Lightbox configs.");
        return;
      }

      // Just return if lightbox is not enabled for this gallery.
      if (!config.enabled) return;

      let keepSeparate = config.hasOwnProperty('keepSeparate') && config['keepSeparate'];
      let gallery = keepSeparate ? {} : globalGallery;
      let uuid = keepSeparate ? util.getUuid() : GLOBAL_GALLERY_UUID;

      gallery.uuid = uuid;
      gallery.dom = galleryDom;

      if (!gallery.configJson) {
        gallery.configJson = config;
      }

      if (!gallery.images) {
        gallery.images = [];
      }

      let imgElements = jq(galleryDom).find('img');

      // Note: imgElements is array-like but not exactly an array.
      [].forEach.call(imgElements, function (imgElement, index) {
        let image = {};
        controller.bindEventToElement(imgElement, 'click', handlers.imageClick(gallery, keepSeparate ? index : globalIndex));
        image.galleryImgDom = imgElement;
        gallery.images.push(image);
        globalIndex++;
      })

      galleries[uuid] = gallery;
    },

    /**
     * Binds the given event to the given element, with the given callback.
     * @param {object} element The DOM of the element to which to bind
     * @param {string} event The name of the event without 'on' (e.g. 'click')
     * @param {function} callback Callback to fire when the event fires
     * @param {*} options Options for the callback
     */
    bindEventToElement: function (element, event, callback, options) {
      if (element.addEventListener) {
        element.addEventListener(event, callback, options);
      } else {
        element.attachEvent('on' + event, function (event) {
          event = event || window.event;
          event.target = event.target || event.srcElement;
          callback(event);
        });
      }
    },

    /**
     * Unbinds the given event from the given element.
     * @param {object} element The DOM of the element to which to bind
     * @param {string} event The name of the event without 'on' (e.g. 'click')
     * @param {function} callback The callback to unregister
     */
    unbindEventFromElement: function (element, event, callback) {
      if (element.removeEventListener) {
        element.removeEventListener(event, callback);
      } else {
        element.detachEvent('on' + event, callback);
      }
    },

    getImageSrc: function (gallery, index, stripParams = false) {
      // These are the various possible sources.
      // src:         URL of image being displayed on the main page. Typically a small image.
      // dataFullUrl: URL of full image (but can be -scaled for large images). Present only for galleries.
      //              dataFullUrl = imgDom.getAttribute('data-full-url');
      // srcSet:      A set of all available image sizes.

      // Since data-full-url is not always available, we always return src and include srcset and sizes.

      let src = gallery.images[index].galleryImgDom.src;
      if (stripParams) {
        src = src.split('?')[0];
      }
      return src;
    },

    getOriginalImage: function (gallery, index) {
      // data-original tag is available only with acclectic smart galleries.
      let dataOriginal = gallery.images[index].galleryImgDom.getAttribute('data-original');
      if (dataOriginal) {
        return dataOriginal.split('/').pop().split('?')[0];
      }

      // If above is not available, infer from path.            
      let fullPath = controller.getImageSrc(gallery, index, true);
      let unscaledImageUrl = controller.getUnscaledImageUrl(fullPath);
      return unscaledImageUrl.split('/').pop().split('?')[0];
    },

    getImageSrcSet: function (gallery, index) {
      let srcset = gallery.images[index].galleryImgDom.getAttribute('accsg-srcset');
      if (!srcset) srcset = gallery.images[index].galleryImgDom.getAttribute('srcset');
      if (!srcset) srcset = '';
      return srcset;
    },

    getImageSizes: function (gallery, index) {
      let srcSet = this.getImageSrcSet(gallery, index);
      let parsedSrcSet = parseSrcset(srcSet);
      if (!parsedSrcSet || parsedSrcSet.length <= 0) {
        return '';
      }
      let maxSize = Math.max.apply(Math, parsedSrcSet.map(function (e) { return e.w; }));
      return maxSize + "px";
    },

    goNext: function (event) {
      if (event)
        event.stopPropagation ? event.stopPropagation() : event.cancelBubble = true;

      // Important: This must be called before show(), so it can be cancelled in show() when slideshow reaches the end.
      if (slideshowTimer) {
        slideshowTimer = setTimeout(controller.goNext, SLIDESHOW_MS);
      }

      lightbox.show(currentGallery, currentImageIndex + 1);
    },

    goPrevious: function (event) {
      if (event)
        event.stopPropagation ? event.stopPropagation() : event.cancelBubble = true;
      lightbox.show(currentGallery, currentImageIndex - 1);
    },

    goToFirst: function () {
      lightbox.show(currentGallery, 0);
    },

    goToLast: function () {
      lightbox.show(currentGallery, currentGallery.images.length - 1);
    },

    handleClose: function (event) {
      event.stopPropagation ? event.stopPropagation() : event.cancelBubble = true;
      lightbox.hide();
    },

    getUnscaledImageUrl: function (url) {
      let fileName = controller.getFilenameFromUrl(url);
      let unscaledFileName = fileName;
      let unscaledUrl = url;

      // The file name can be one of the following:
      // 1. The full size file name (DSC1234.jpg): typical for small original images.
      // 2. The scaled image (DSC1234-scaled.jpg) from data-full-url, if in a gallery.
      // 3. Some other scaled image (DSC1234-100x200.jpg) from src or srcset, if an image.

      // Case 2: Regex to extract -scaled suffix, including .
      // e.g. 'DSC1234-scaled.jpg' returns '-scaled.'
      let scaledRegex = /-scaled\./;

      // Case 3: Regex to find the pattern between the LAST '-' and '.' inclusive using negative lookahead.
      // e.g. 'DSC1234-5x7-100x200.jpg' returns '-100x200.'
      let randomSizeRegex = /(-(?:.(?!-))+)\./g;

      if (fileName.match(scaledRegex)) {
        unscaledFileName = fileName.replace(scaledRegex, '.');
      } else if (fileName.match(randomSizeRegex)) {
        unscaledFileName = fileName.replace(randomSizeRegex, '.');

        // If the thumbs are post-generated using a plugin, they may be named after scaled, e.g. Foo-scaled-100x200.jpg.
        if (unscaledFileName.match(scaledRegex)) {
          unscaledFileName = unscaledFileName.replace(scaledRegex, '.');
        }
      }

      unscaledUrl = url.replace(fileName, unscaledFileName);
      return unscaledUrl;
    },

    getFilenameFromUrl: function (url) {
      // Some srcset values may include parameters, e.g. ?resize=.
      return url.split('/').pop().split('?')[0];
    },

    isFullScreen: function () {
      // Note that there is currently no way to account for pre-existing full-screen mode.
      // See: https://stackoverflow.com/questions/43392583/fullscreen-api-not-working-if-triggered-with-f11
      return !!(document.fullscreenElement || document.fullScreen || document.webkitIsFullScreen ||
        document.mozFullScreen || document.msFullscreenElement ||
        document.mozFullScreenElement || document.webkitFullscreenElement);
    },

    bindFullscreenListeners: function () {
      document.addEventListener("fullscreenchange", handlers.fullScreenChange, false);
      document.addEventListener("webkitfullscreenchange", handlers.fullScreenChange, false);
      document.addEventListener("mozfullscreenchange", handlers.fullScreenChange, false);
      document.addEventListener("MSFullscreenChanges", handlers.fullScreenChange, false);
    }
  };

  var handlers = {

    /** Handles an image click in the main gallery page; launches the lightbox. */
    imageClick: function (gallery, index) {
      return function (event) {
        event.preventDefault ? event.preventDefault() : event.returnValue = false;
        lightbox.populateSlider(gallery, index);
        lightbox.show(gallery, index);
      }
    },

    toggleInfo: function () {
      showingInfo ? lightbox.hideInfo() : lightbox.showInfo();
      showingInfo = !showingInfo;
    },

    toggleFullScreen: function () {
      console.log(controller.isFullScreen());
      if (controller.isFullScreen()) {
        lightbox.closeFullscreen()
      } else {
        lightbox.openFullscreen();
      }
    },

    toggleSlideshow: function () {
      slideshowTimer ? lightbox.pauseSlideshow() : lightbox.startSlideshow();
    },

    share: function () {
      if (!currentGallery) return;

      navigator.clipboard.writeText(controller.getImageSrc(currentGallery, currentImageIndex))
        .then(() => {
          alert(i18n['sharedToClipboard']);
        })
        .catch(error => {
          console.log('Error sharing link: ', error);
        });
    },

    keyDown: function (event) {
      switch (event.keyCode) {
        case 27: //Escape
          controller.handleClose(event);
          break;

        case 33: // Page up
          break;

        case 34: // Page down
          break;

        case 35: // End
          controller.goToLast();
          break;

        case 36: // Home
          controller.goToFirst();
          break;

        case 37: // Left
          controller.goPrevious(event);
          break;

        case 39: //Right
          controller.goNext(event);
          break;

        case 70:// F
          handlers.toggleFullScreen();
          break;

        case 73: // I
          handlers.toggleInfo();
          break;

        case 80: // P
          handlers.toggleSlideshow();
          break;

        case 83: // S
          handlers.share();
          break;
      }
    },

    fullScreenChange: function () {
      enterFullScreen.getElementsByTagName('img')[0].src = controller.isFullScreen() ?
        config.assetsPath + FULL_SCREEN_EXIT_ICON :
        config.assetsPath + FULL_SCREEN_ENTER_ICON;
    },
  };

  var lightbox = {
    /** The DOM element of the lightbox. Populated by build(). */
    element: null,

    /** The DOM element of the slider. Populated by build(). */
    slider: null,

    /** Builds the lightbox and adds it to the document. It is not shown until calling of show(). */
    build: function () {
      let results = builder.getLightboxTopAndSlider();
      this.element = results.lightbox;
      this.slider = results.slider;

      document.body.appendChild(this.element);
    },

    /**
     * Shows the lightbox and displays the given image.
     * @param {object} gallery The chosen gallery to display 
     * @param {integer} index The chosen image to display
     */
    show: function (gallery, index) {
      if (index < 0 || index >= gallery.images.length) {
        if (index < 0) {
          this.bounce('start');
        } else {
          this.bounce('end');
          if (slideshowTimer) {
            lightbox.pauseSlideshow();
          }
        }
        return;
      }

      // Bind keyboard events.
      controller.bindEventToElement(document, 'keydown', handlers.keyDown);

      currentGallery = gallery;
      currentImageIndex = index;

      document.body.classList.add('noscroll');
      this.element.classList.add('visible');

      controller.bindFullscreenListeners();

      this.applyTheme(gallery);
      this.loadImageAndPreloadNeighbors(gallery, index, NUM_PRELOAD_NEIGHBORS);
      this.slideToCurrentImage();
    },

    /** Hides the lightbox. */
    hide: function () {
      document.body.classList.remove('noscroll');
      this.element.classList.remove('visible');
      controller.unbindEventFromElement(document, 'keydown', handlers.keyDown);
      if (slideshowTimer) {
        lightbox.pauseSlideshow();
      }
    },

    applyTheme: function (gallery) {
      if (!gallery || !gallery.configJson || !gallery.configJson.theme) return;

      let theme = gallery.configJson.theme;
      let root = document.querySelector(':root');

      switch (theme) {
        case 'light':
          root.style.setProperty('--backgroundColor', LIGHT_COLOR);
          root.style.setProperty('--foregroundColor', DARK_COLOR);
          root.style.setProperty('--foregroundInvert', 0);
          break;
        case 'dark':
          root.style.setProperty('--backgroundColor', DARK_COLOR);
          root.style.setProperty('--foregroundColor', LIGHT_COLOR);
          root.style.setProperty('--foregroundInvert', 100);
          break;
      }

    },

    openFullscreen: function () {
      let doc = document.documentElement;

      if (doc.requestFullscreen) {
        doc.requestFullscreen();
      } else if (doc.webkitRequestFullscreen) { /* Safari */
        doc.webkitRequestFullscreen();
      } else if (doc.msRequestFullscreen) { /* IE11 */
        doc.msRequestFullscreen();
      }

      // Icon is set in fullScreenChange handler so that the icon state can change even when the user presses ESC.
    },

    closeFullscreen: function () {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) { /* Safari */
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) { /* IE11 */
        document.msExitFullscreen();
      }

      // Icon is set in fullScreenChange handler so that the icon state can change even when the user presses ESC.
    },

    startSlideshow: function () {
      slideshowTimer = setTimeout(controller.goNext, SLIDESHOW_MS);
      play.getElementsByTagName('img')[0].src = config.assetsPath + PAUSE_ICON;
    },

    pauseSlideshow: function () {
      play.getElementsByTagName('img')[0].src = config.assetsPath + PLAY_ICON;
      if (slideshowTimer) {
        clearTimeout(slideshowTimer);
        slideshowTimer = null;
      }
    },

    bounce: function (whichEnd) {
      this.slider.classList.add('bounce-' + whichEnd);
      setTimeout(() => {
        this.slider.classList.remove('bounce-' + whichEnd);
      }, 500);
    },

    slideToCurrentImage: function () {
      var offset = -currentImageIndex * 100 + '%';
      this.slider.style.transform = this.slider.style.webkitTransform = 'translate3d(' + offset + ',0,0)'
    },

    /** Populates the slider with containers for all images. Actual images are not included yet. */
    populateSlider: function (gallery, index) {
      this.clearSlider();

      for (let i = 0; i < gallery.images.length; i++) {
        gallery.images[i].slideDom = builder.getSlide(i);
        this.slider.appendChild(gallery.images[i].slideDom);
      }
    },

    clearSlider: function () {
      this.slider.innerHTML = '';
    },

    loadImageAndPreloadNeighbors(gallery, index, numNeighbors) {
      this.loadImage(gallery, index);
      for (let i = 1; i <= numNeighbors; i++) {
        // loadImage accounts for out-of-range indices.
        this.loadImage(gallery, index - i);
        this.loadImage(gallery, index + i);
      }
    },

    /** Loads the image given image and adds it to the slider at the image's index. */
    loadImage: function (gallery, index) {
      if (index < 0 || index >= gallery.images.length) return;

      let imageContainer = jq('#acclectic-lightbox-slide-' + index);

      // Early exit if image is already loaded. 
      // However, we must still call displayExif() to update EXIF data since the sidebar is shared.
      if (jq(imageContainer).find('img').length > 0) {
        this.displayExif(gallery, index);
        return;
      }

      jq(imageContainer)[0].appendChild(builder.getImage(gallery, index));
      lightbox.requestExif(gallery, index);
    },

    /** Returns the DOM of the title and caption elements for the given image. */
    getDomsForImage: function (gallery, index) {
      let slideDom = gallery.images[index].slideDom;
      let titleDom = jq(slideDom).find('.title-bar-title');
      let captionDom = jq(slideDom).find('.title-bar-caption');
      let barDom = jq(slideDom).find('.title-bar');

      return {
        title: titleDom ? titleDom[0] : null,
        caption: captionDom ? captionDom[0] : null,
        bar: barDom ? barDom[0] : null,
      };
    },

    /** Shows the info sidebar. */
    showInfo: function () {
      let infoBox = jq('#acclectic-lightbox-container #info');
      infoBox[0].classList.add('visible');
    },

    /** Hides the info sidebar. */
    hideInfo: function () {
      let infoBox = jq('#acclectic-lightbox-container #info');
      infoBox[0].classList.remove('visible');
    },

    /** Requests EXIF metadata for the given image. Results are saved to gallery.images[index]. */
    requestExif: function (gallery, index) {
      // TODO: If neither EXIF/title/caption are requested, skip.
      var request = new XMLHttpRequest();

      var fullPath = controller.getImageSrc(gallery, index, true);

      var unscaledImageUrl = fullPath;
      if (FORCE_GET_EXIF_FROM_ORIGINAL) {
        unscaledImageUrl = controller.getUnscaledImageUrl(fullPath);
      }

      let fileInfo = {};
      fileInfo.fullPath = fullPath;
      fileInfo.name = controller.getFilenameFromUrl(fullPath);
      fileInfo.nameUnscaled = controller.getOriginalImage(gallery, index);

      gallery.images[index].fileInfo = fileInfo;

      request.open('GET', unscaledImageUrl, true);
      request.responseType = 'blob';
      request.onload = function () {
        var reader = new FileReader();
        reader.readAsArrayBuffer(request.response);
        reader.onload = function (readerEvent) {
          try {
            let tags = ExifReader.load(readerEvent.target.result);
            delete tags['MakerNote']; // The MakerNote tag can be very large.
            gallery.images[index].exif = tags;
            lightbox.displayExif(gallery, index);
          } catch (error) {
            console.log("Error loading EXIF data:");
            console.log(error);
          }
        };
      };
      request.send();
    },

    /** Populates EXIF data in the info sidebar. Also updates the title and caption in the slider. */
    displayExif: function (gallery, index) {
      // Early exit for preloads where we get called on a different image.
      if (currentGallery != gallery || currentImageIndex != index) return;

      // We can get here if:
      // 1. There is really no EXIF data, so show no info available.
      // 2. The request has been dispatched but file is not yet loaded. In this case, we expect 
      //    reader.onload to call us again. This case is possible on next/previous, where the
      //    image is preloaded/preloading but EXIF hasn't yet come back.
      if (gallery.images[index].exif == null) return;

      let container = jq("#acclectic-lightbox-container #info .info-container")[0];
      let imageExif = gallery.images[index].exif;

      let titleValue = exif.getFirstDescriptionOfTags(['title', 'Object Name'], imageExif);
      let captionValue = exif.getFirstDescriptionOfTags(['description', 'Caption/Abstract', 'ImageDescription'], imageExif);
      lightbox.updateTitleAndCaption(gallery, index, titleValue, captionValue);

      let title = builder.getTitleSection(titleValue);
      let keywords = builder.getKeywordsSection(exif.getKeywords(imageExif));
      let cameraInfo = builder.getCameraInfoSection(exif.getCameraInfo(imageExif));
      let fileInfo = builder.getFileInfoSection(exif.getFileInfo(imageExif, gallery.images[index].fileInfo));
      let gpsInfo = builder.getGpsSection(exif.getGpsString(imageExif));

      container.innerHTML = '';
      container.appendChild(title);
      if (keywords && gallery.configJson.showKeywords) container.appendChild(keywords);
      if (cameraInfo && gallery.configJson.showExif) container.appendChild(cameraInfo);
      if (fileInfo && gallery.configJson.showFileInfo) container.appendChild(fileInfo);
      if (gpsInfo && gallery.configJson.showGps) container.appendChild(gpsInfo);
    },

    /** Updates the title and caption in the main slider. */
    updateTitleAndCaption: function (gallery, index, title, caption) {
      let doms = lightbox.getDomsForImage(gallery, index);

      let titleExists = title && title.length > 0 && gallery.configJson.showTitle;
      let captionExists = caption && caption.length > 0 && gallery.configJson.showCaption;

      // If neither title nor caption exists, hide the whole bar.
      if (!titleExists && !captionExists) {
        doms.bar.classList.remove('visible');
        return;
      }

      doms.bar.classList.add('visible');

      if (doms.title) {
        if (titleExists) {
          doms.title.innerText = title;
          doms.title.classList.add('visible');
        } else {
          doms.title.classList.remove('visible');
        }
      }

      if (doms.caption) {
        if (captionExists) {
          doms.caption.innerText = caption;
          doms.caption.classList.add('visible');
        } else {
          doms.caption.classList.remove('visible');
        }
      }
    },

  };

  var builder = {

    getLightboxTopAndSlider: function () {
      let element = document.createElement('div');
      element.setAttribute('id', 'acclectic-lightbox-top');
      element.classList.add('lightbox-background');

      let container = document.createElement('div');
      container.setAttribute('id', 'acclectic-lightbox-container');

      let infoBox = document.createElement('aside');
      infoBox.setAttribute('id', 'info');
      infoBox.classList.add('lightbox-background');
      let infoBoxInner = document.createElement('div');
      infoBoxInner.className = 'info-container';
      infoBox.appendChild(infoBoxInner);

      let sliderFrame = document.createElement('div');
      sliderFrame.setAttribute('id', 'slider-frame');

      let slider = builder.getEmptySlider();
      sliderFrame.appendChild(slider);

      container.appendChild(builder.getNavLeft());
      container.appendChild(builder.getMobileMenuButton());
      container.appendChild(infoBox);
      container.appendChild(sliderFrame);
      container.appendChild(builder.getNavRight());

      element.appendChild(container);

      return {
        lightbox: element,
        slider: slider
      };
    },

    getControlIcon: function (src) {
      let iconLi = document.createElement('li');
      let icon = document.createElement('img');
      icon.classList = 'control-icon';
      icon.setAttribute('src', config.assetsPath + src);
      iconLi.appendChild(icon);
      return iconLi;
    },

    getCloseIcon: function (src) {
      let icon = document.createElement('img');
      icon.classList = 'nav-close';
      icon.setAttribute('src', config.assetsPath + src);
      return icon;
    },

    getNavArrow: function (src) {
      let icon = document.createElement('img');
      icon.classList = 'nav-arrow';
      icon.setAttribute('src', config.assetsPath + src);
      return icon;
    },

    getEmptySlider: function () {
      let slider = document.createElement('div');
      slider.setAttribute('id', 'acclectic-lightbox-slider');
      return slider;
    },

    getSlide: function (i) {
      let container = document.createElement('div');
      container.className = 'acclectic-lightbox-slide';
      container.id = 'acclectic-lightbox-slide-' + i;
      return container;
    },

    getImage: function (gallery, index) {
      let outer = document.createElement('div');
      outer.className = 'slide-img-container'

      let container = document.createElement('figure');

      let spinner = this.getSpinner();
      container.appendChild(spinner);

      let img = document.createElement('img');
      img.setAttribute('sizes', controller.getImageSizes(gallery, index));
      img.setAttribute('srcset', controller.getImageSrcSet(gallery, index));
      img.setAttribute('src', controller.getImageSrc(gallery, index));
      img.onload = function () {
        container.removeChild(spinner);
      }

      let titleBar = document.createElement('figcaption');
      titleBar.className = 'title-bar';
      let title = document.createElement('div');
      title.className = 'title-bar-title';
      let caption = document.createElement('div');
      caption.className = 'title-bar-caption';
      titleBar.appendChild(title);
      titleBar.appendChild(caption);

      container.appendChild(img);
      container.appendChild(titleBar);

      outer.appendChild(container);

      var swipeHandler = new Hammer(img);
      swipeHandler.on('swipeleft', () => {
        controller.goNext();
      });
      swipeHandler.on('swiperight', () => {
        controller.goPrevious();
      });
      return outer;
    },

    getSpinner: function () {
      let spinnerContainer = document.createElement('div');
      spinnerContainer.className = 'spinner-container';
      let spinner = document.createElement('div');
      spinner.className = 'loading-spinner';
      for (let i = 0; i < 5; i++) {
        let dot = document.createElement('div');
        dot.className = 'loading-spinner-dot';
        spinner.appendChild(dot);
      }
      spinnerContainer.appendChild(spinner);
      return spinnerContainer;
    },

    getNavLeft: function () {
      let navLeft = document.createElement('div');
      navLeft.setAttribute('id', 'nav-left');
      navLeft.classList.add('lightbox-background');

      let controlsUl = document.createElement('ul');
      controlsUl.className = 'lightbox-controls';

      enterFullScreen = builder.getControlIcon(FULL_SCREEN_ENTER_ICON);
      play = builder.getControlIcon(PLAY_ICON);
      info = builder.getControlIcon(INFO_ICON);
      share = builder.getControlIcon(SHARE_ICON);

      controller.bindEventToElement(enterFullScreen, 'click', handlers.toggleFullScreen);
      controller.bindEventToElement(info, 'click', handlers.toggleInfo);
      controller.bindEventToElement(play, 'click', handlers.toggleSlideshow);
      controller.bindEventToElement(share, 'click', handlers.share);

      controlsUl.appendChild(enterFullScreen);
      controlsUl.appendChild(play);
      controlsUl.appendChild(info);
      controlsUl.appendChild(share);

      let leftArrow = builder.getNavArrow(PREV_ICON);
      controller.bindEventToElement(leftArrow, 'click', controller.goPrevious);

      navLeft.appendChild(controlsUl);
      navLeft.appendChild(leftArrow);

      return navLeft;
    },

    getNavRight: function () {
      let navRight = document.createElement('div');
      navRight.setAttribute('id', 'nav-right');
      navRight.classList.add('lightbox-background');

      let closeIcon = builder.getCloseIcon(CLOSE_ICON);
      controller.bindEventToElement(closeIcon, 'click', controller.handleClose);

      let rightArrow = builder.getNavArrow(NEXT_ICON);
      controller.bindEventToElement(rightArrow, 'click', controller.goNext);

      navRight.appendChild(closeIcon);
      navRight.appendChild(rightArrow);
      return navRight;
    },

    getMobileMenuButton: function () {
      let menu = document.createElement('div');
      menu.setAttribute('id', 'mobile-menu-button');
      menu.classList.add('lightbox-background');

      let controlsUl = document.createElement('ul');
      controlsUl.className = 'lightbox-controls';

      enterFullScreen = builder.getControlIcon(FULL_SCREEN_ENTER_ICON);
      play = builder.getControlIcon(PLAY_ICON);
      info = builder.getControlIcon(INFO_ICON);
      share = builder.getControlIcon(SHARE_ICON);
      let leftArrow = builder.getControlIcon(PREV_ICON);
      let rightArrow = builder.getControlIcon(NEXT_ICON);
      let closeIcon = builder.getControlIcon(CLOSE_ICON);

      controller.bindEventToElement(enterFullScreen, 'click', handlers.toggleFullScreen);
      controller.bindEventToElement(info, 'click', handlers.toggleInfo);
      controller.bindEventToElement(play, 'click', handlers.toggleSlideshow);
      controller.bindEventToElement(share, 'click', handlers.share);
      controller.bindEventToElement(leftArrow, 'click', controller.goPrevious);
      controller.bindEventToElement(closeIcon, 'click', controller.handleClose);
      controller.bindEventToElement(rightArrow, 'click', controller.goNext);

      controlsUl.appendChild(enterFullScreen);
      controlsUl.appendChild(play);
      controlsUl.appendChild(info);
      controlsUl.appendChild(share);
      controlsUl.appendChild(leftArrow);
      controlsUl.appendChild(rightArrow);
      controlsUl.appendChild(closeIcon);

      menu.appendChild(controlsUl);

      return menu;
    },

    getTitleSection: function (titleText) {
      let title = document.createElement('div');
      title.className = 'info-title';
      title.innerText = DEFAULT_TITLE;
      if (titleText) {
        title.innerText = titleText;
      }
      return title;
    },

    getKeywordsSection: function (keywordsText) {
      if (!keywordsText || keywordsText.length <= 0) return null;

      let keywords = document.createElement('div');
      keywords.className = 'info-section';
      let keywordsHeading = document.createElement('div');
      keywordsHeading.className = 'info-heading';
      keywordsHeading.innerText = i18n['keywords'];
      let keywordsValue = document.createElement('div');
      keywordsValue.className = 'info-value';
      keywordsValue.innerText = keywordsText;
      keywords.appendChild(keywordsHeading);
      keywords.appendChild(keywordsValue);
      return keywords;
    },

    getCameraInfoSection: function (cameraInfoText) {
      if (!cameraInfoText) return null;

      let cameraInfo = document.createElement('div');
      cameraInfo.className = 'info-section';
      let cameraHeading = document.createElement('div');
      cameraHeading.className = 'info-heading';
      cameraHeading.innerText = i18n['cameraInfo'];
      let cameraValue = document.createElement('div');
      cameraValue.className = 'info-value';
      cameraValue.appendChild(cameraInfoText);
      cameraInfo.appendChild(cameraHeading);
      cameraInfo.appendChild(cameraValue);
      return cameraInfo;
    },

    getFileInfoSection: function (fileInfoText) {
      if (!fileInfoText) return null;

      let fileInfo = document.createElement('div');
      fileInfo.className = 'info-section';
      let fileHeading = document.createElement('div');
      fileHeading.className = 'info-heading';
      fileHeading.innerText = i18n['fileInfo'];
      let fileValue = document.createElement('div');
      fileValue.className = 'info-value';
      fileValue.appendChild(fileInfoText);
      fileInfo.appendChild(fileHeading);
      fileInfo.appendChild(fileValue);
      return fileInfo;
    },

    getGpsSection: function (gpsText) {
      if (!gpsText) return null;

      let gpsInfo = document.createElement('div');
      gpsInfo.className = 'info-section';
      let gpsHeading = document.createElement('div');
      gpsHeading.className = 'info-heading';
      gpsHeading.innerText = i18n['location'];
      let mapFrame = document.createElement('iframe');
      mapFrame.className = 'gps-iframe';

      let zoom = MAP_ZOOM;

      mapFrame.src = "https://www.google.com/maps/embed/v1/place?key=" + MAPS_API_KEY + "&q=" + gpsText + "&zoom=" + zoom;

      gpsInfo.appendChild(gpsHeading);
      gpsInfo.appendChild(mapFrame);
      return gpsInfo;
    },
  };

  var exif = {

    // References:
    // EXIF: https://www.exiv2.org/tags.html
    // IPTC: https://www.iptc.org/std/photometadata/specification/IPTC-PhotoMetadata
    // XMP: https://wwwimages2.adobe.com/content/dam/acom/en/devnet/xmp/pdfs/XMP%20SDK%20Release%20cc-2016-08/XMPSpecificationPart3.pdf

    cameraAttributes: [
      {
        display: i18n['cameraMake'],
        tags: ['Make']
      },
      {
        display: i18n['cameraModel'],
        tags: ['Model']
      },
      {
        display: i18n['lens'],
        tags: ['LensSpecification', 'LensModel', 'Lens']
      },
      {
        display: i18n['focalLength'],
        tags: ['FocalLength']
      },
      {
        display: i18n['focalLength35mm'],
        tags: ['FocalLengthIn35mmFilm']
      },
      {
        display: i18n['aperture'],
        tags: ['FNumber', 'ApertureValue']
      },
      {
        display: i18n['shutterSpeed'],
        tags: ['ShutterSpeedValue', 'ExposureTime']
      },
      {
        display: i18n['iso'],
        tags: ['ISOSpeedRatings']
      },
      {
        display: i18n['exposureProgram'],
        tags: ['ExposureProgram']
      },
      {
        display: i18n['exposureBias'],
        tags: ['ExposureBiasValue']
      },
      {
        display: i18n['exposureMode'],
        tags: ['ExposureMode']
      },
      {
        display: i18n['whiteBalance'],
        tags: ['WhiteBalance']
      },
      {
        display: i18n['meteringMode'],
        tags: ['MeteringMode']
      },
      {
        display: i18n['flash'],
        tags: ['Flash']
      },

    ],

    fileAttributes: [
      {
        display: i18n['taken'],
        tags: ['DateTimeOriginal']
      },
      {
        display: i18n['modified'],
        tags: ['DateTime', 'DateTimeDigitized']
      },
      {
        display: i18n['width'],
        tags: ['Image Width']
      },
      {
        display: i18n['height'],
        tags: ['Image Height']
      },
      {
        display: i18n['artist'],
        tags: ['Artist']
      },
      {
        display: i18n['colorSpace'],
        tags: ['ColorSpace']
      },
    ],

    getKeywords: function (exif) {
      if (!exif.subject || !exif.subject.value || exif.subject.value.length <= 0)
        return null;

      let keywordArray = exif.subject.value.map(v => v.value);
      return keywordArray.join('  |  ');
    },

    getCameraInfo: function (imageExif) {
      let table = document.createElement('table');
      let numRows = exif.appendRowsToTable(table, exif.cameraAttributes, imageExif);
      return numRows > 0 ? table : null;
    },

    getFileInfo: function (imageExif, fileInfo) {
      let table = document.createElement('table');

      if (fileInfo.name)
        table.appendChild(exif.getAttributeRow(i18n['file'], fileInfo.name));

      if (fileInfo.nameUnscaled)
        table.appendChild(exif.getAttributeRow(i18n['unscaledFile'], fileInfo.nameUnscaled));

      exif.appendRowsToTable(table, exif.fileAttributes, imageExif);
      return table;
    },

    getGpsString: function (imageExif) {
      let latitude = ['GPSLatitude'];
      let latitudeRef = ['GPSLatitudeRef'];
      let longitude = ['GPSLongitude'];
      let longitudeRef = ['GPSLongitudeRef'];

      let latitudeValue = exif.getFirstDescriptionOfTags(latitude, imageExif);
      let latitudeRefValue = exif.getFirstValueOfTags(latitudeRef, imageExif);
      let longitudeValue = exif.getFirstDescriptionOfTags(longitude, imageExif);
      let longitudeRefValue = exif.getFirstValueOfTags(longitudeRef, imageExif);

      if (!latitudeValue || !latitudeRefValue || !longitudeValue || !longitudeRefValue) return null;

      let latitudePrefix = latitudeRefValue.toUpperCase().indexOf('N') >= 0 ? '' : '-';
      let longitudePrefix = longitudeRefValue.toUpperCase().indexOf('E') >= 0 ? '' : '-';;
      let gpsString = latitudePrefix + latitudeValue + ',' + longitudePrefix + longitudeValue;
      return gpsString;
    },

    appendRowsToTable: function (table, attributes, imageExif) {
      let numRowsAdded = 0;
      attributes.forEach(attr => {
        let value = exif.getFirstDescriptionOfTags(attr.tags, imageExif);
        if (value) {
          let row = exif.getAttributeRow(attr.display, value);
          table.appendChild(row);
          numRowsAdded++;
        }
      });
      return numRowsAdded;
    },

    getFirstDescriptionOfTags: function (tags, imageExif) {
      let value = null;
      tags.every(tag => {
        if (imageExif[tag] && imageExif[tag].description) {
          value = imageExif[tag].description;
          return false; // Stop looping through other tags.
        }
        return true;
      });
      return value;
    },

    getFirstValueOfTags: function (tags, imageExif) {
      let value = null;
      tags.every(tag => {
        if (imageExif[tag] && imageExif[tag].value && imageExif[tag].value.length > 0) {
          value = imageExif[tag].value[0];
          return false; // Stop looping through other tags.
        }
        return true;
      });
      return value;
    },

    getAttributeRow: function (label, value) {
      let row = document.createElement('tr');
      let labelTd = document.createElement('td');
      labelTd.className = 'attr-label';
      let valueTd = document.createElement('td');
      valueTd.className = 'attr-value';

      labelTd.innerText = label;
      valueTd.innerText = value;

      row.appendChild(labelTd);
      row.appendChild(valueTd);
      return row;
    },

  };

  var util = {
    // From https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
    getUuid: function () {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  };

  jq(document).ready(function () {
    controller.init()
  })

}(jQuery);
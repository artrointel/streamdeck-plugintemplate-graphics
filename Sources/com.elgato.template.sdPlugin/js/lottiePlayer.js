/** SDLottiePlayer is a lottie player to load lottie animations in the stream deck plugin.
 * Interface of this SDLottiePlayer would not be changed even if below issues are fixed.
 * 
 * Dependencies:
 * - import lottie.js library(https://github.com/airbnb/lottie-web/) to make it work.
 * - import timers.js for interval issue quickfix from https://github.com/elgatosf/streamdeck-timerfix
 * 
 * Issues:
 * - Lottie animation play does not work.
 *    don't know why, currently lottie animation play does not work in the stream deck.
 *    it uses goToAndStop() instead play() as a workaround code.
 */

//TODO https://www.robinwieruch.de/javascript-naming-conventions
function SDLottiePlayer(frameRate = 30) {
	var mFrameDuration = 1000.0 / frameRate,
		mSpeed = 1.0;

	var	mAnimationUpdateListener = null,
		mAnimationFinishedListener = null;

	var mRenderTimer = null,
		mLottieRenderer = null;

	function play(lottieFilePath, doLoop = true) {
		if (mLottieRenderer != null) {
			_destroyLottieRenderer();
		}

		if (mRenderTimer != null) {
			_destroyRenderTimer();
        }

		mLottieRenderer = new SDLottieRenderer(lottieFilePath, doLoop);
		mLottieRenderer.initialize(function () {
			_createRenderTimer();
		});
	}

	function pause() {
		_destroyRenderTimer();
	}

	function resume() {
		if (mRenderTimer == null) {
			_createRenderTimer();
        }
	}

	function setSpeed(speed) {
		mSpeed = speed;
	}

	function setAnimationUpdateListener(listener) {
		mAnimationUpdateListener = listener;
	}

	function setAnimationFinishedListener(listener) {
		mAnimationFinishedListener = listener;
    }

	// Internal only
	function _createRenderTimer() {
		mRenderTimer = window.setInterval(function () {
			mLottieRenderer.renderNextFrame(mFrameDuration * mSpeed);
			if (mAnimationUpdateListener != null) {
				mAnimationUpdateListener();
            }
			if (mLottieRenderer.isFinished()) {
				_destroyRenderTimer();
				if (mAnimationFinishedListener != null) {
					mAnimationFinishedListener();
                }
			}
		}, mFrameDuration);
    }

	// Internal only
	function _destroyRenderTimer() {
		if (mRenderTimer != null) {
			window.clearInterval(mRenderTimer);
			mRenderTimer = null;
		}
	}

	// Internal only
	function _destroyLottieRenderer() {
		mLottieRenderer.destroy();
		mLottieRenderer = null;
	}

	function destroy() {
		_destroyRenderTimer();
		_destroyLottieRenderer();
		console.log("destroyed lottie player");
	}

	function getImageData() {
		return mLottieRenderer.getImageData();
	}

	function getTotalDuration() {
		return mLottieRenderer.getTotalDuration();
	}

	function getCurrentDuration() {
		return mLottieRenderer.getCurrentDuration();
	}

	return {
		play: play,
		pause: pause,
		resume: resume,
		setSpeed: setSpeed,
		setAnimationUpdateListener: setAnimationUpdateListener,
		setAnimationFinishedListener: setAnimationFinishedListener,
		destroy: destroy,
		getImageData: getImageData,
		getTotalDuration: getTotalDuration,
		getCurrentDuration: getCurrentDuration,
	};
}

// Internal only.
function SDLottieRenderer (lottieFilePath, doLoop) {
	var mFilePath = lottieFilePath,
		mDoLoop = doLoop;
	
	var mCanvas = null; // offscreen canvas to be drawn
	var mAnimation = null; // lottie animation instance

	var mTotalDuration = 0.0,
		mCurrentDuration = 0.0;
	
	function initialize(onLoadFinished) {
		mCanvas = document.createElement("canvas");
        mCanvas.width = 144;
        mCanvas.height = 144;
		
		const ctx = mCanvas.getContext("2d");
		mAnimation = lottie.loadAnimation({
			renderer: "canvas",
			rendererSettings: {
			context: ctx,
			clearCanvas: true,
			},
			loop: true,
			autoplay: true,
			path: mFilePath
		});

		// on animation data loading is finished
		mAnimation.addEventListener("data_ready", function() {
			mTotalDuration = mAnimation.getDuration(false) * 1000.0;
			if (onLoadFinished() != null) {
				onLoadFinished();
			}
		});
    }

	function destroy() {
		if (mAnimation != null) {
			mAnimation.destroy();
			mAnimation = null;
		}
	}

	// Workaround for lottie.play() function.
	// goToAndStop() renders once on the canvas. 
	function renderNextFrame(animationIntervalInMillisecond) {
		if (mAnimation != null) {
			// it does not play the animation after a frame rendering.
			mAnimation.goToAndStop(mCurrentDuration, false);

			mCurrentDuration += animationIntervalInMillisecond;
			if (mCurrentDuration > mTotalDuration) {
				if (mDoLoop) {
					mCurrentDuration -= mTotalDuration;
				} else {
					mCurrentDuration = mTotalDuration;
                }
			}
		}
	}

	function isFinished() {
		if (!mDoLoop && mCurrentDuration == mTotalDuration) {
			return true;
		} else {
			return false;
        }
    }

	function getCanvas() {
		return mCanvas;
    }
	
	function getImageData() {
		return mCanvas.toDataURL();
	}

	function getDuration() {
		return mTotalDuration;
    }

	function getCurrentDuration() {
		return mCurrentDuration;
	}

	return {
		initialize: initialize,
		destroy: destroy,
		renderNextFrame: renderNextFrame,
		isFinished: isFinished,
		getCanvas: getCanvas,
		getImageData: getImageData,
		getDuration: getDuration,
		getCurrentDuration: getCurrentDuration
    };
}

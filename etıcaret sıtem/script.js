document.addEventListener('DOMContentLoaded', () => {
    const cartCountElement = document.getElementById('cart-count');
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalAmountElement = document.getElementById('cart-total-amount');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const cartSummaryElement = document.getElementById('cart-summary');
    const checkoutButton = document.querySelector('.checkout-btn');
    const cartView = document.getElementById('cart-view');
    const paymentScreen = document.getElementById('payment-screen');
    const paymentForm = document.getElementById('payment-form');
    const cancelPaymentButton = document.querySelector('.cancel-payment-btn');
    const paymentSuccessMessage = document.getElementById('payment-success-message');

    const sliderTrack = document.querySelector('.slider-track');
    const slides = Array.from(sliderTrack?.children || []);
    const nextButton = document.querySelector('.slider-btn.next');
    const prevButton = document.querySelector('.slider-btn.prev');
    const dotsNav = document.querySelector('.slider-dots');
    let slideInterval;
    const slideIntervalTime = 6000;
    let currentSlideIndex = 0;
    let isTransitioning = false;

    let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];

    addToCartButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            const productCard = event.target.closest('.product-card');
            if (!productCard) return;

            const productId = productCard.dataset.id;
            const productName = productCard.dataset.name;
            const productPrice = parseFloat(productCard.dataset.price);
            const productImage = productCard.querySelector('.product-front img')?.src || productCard.dataset.imageFront;

            addToCart(productId, productName, productPrice, productImage);

            button.textContent = 'Eklendi!';
            button.classList.add('added');
            button.disabled = true;

            setTimeout(() => {
                button.textContent = 'Sepete Ekle';
                button.classList.remove('added');
                 button.disabled = false;
            }, 1500);
        });
    });

    if (cartItemsContainer) {
         cartItemsContainer.addEventListener('click', handleCartActions);
    }

    if (checkoutButton) {
        checkoutButton.addEventListener('click', () => {
            if (cartView && paymentScreen && cart.length > 0) {
                cartView.style.display = 'none';
                paymentScreen.style.display = 'block';
                paymentSuccessMessage.style.display = 'none';
                paymentForm.style.display = 'block';
                paymentForm.reset();
                window.scrollTo(0, 0);
            }
        });
    }

     if (paymentForm) {
         paymentForm.addEventListener('submit', (event) => {
             event.preventDefault();
             const payButton = paymentForm.querySelector('.pay-now-btn');
             payButton.textContent = 'İşleniyor...';
             payButton.disabled = true;
             if(cancelPaymentButton) cancelPaymentButton.disabled = true;

             setTimeout(() => {
                paymentForm.style.display = 'none';
                paymentSuccessMessage.style.display = 'flex';
                cart = [];
                updateCart();

                 setTimeout(() => {
                      showCartView();
                      payButton.textContent = 'Ödemeyi Tamamla';
                      payButton.disabled = false;
                       if(cancelPaymentButton) cancelPaymentButton.disabled = false;
                 }, 3500);

             }, 1800);
         });
     }

     if (cancelPaymentButton) {
         cancelPaymentButton.addEventListener('click', () => {
             showCartView();
         });
     }

     nextButton?.addEventListener('click', () => handleNavigation('next'));
     prevButton?.addEventListener('click', () => handleNavigation('prev'));
     dotsNav?.addEventListener('click', e => {
        const targetDot = e.target.closest('button.dot');
        if (!targetDot || isTransitioning) return;

        const targetIndex = Array.from(dotsNav.children).findIndex(dot => dot === targetDot);
        if (targetIndex !== currentSlideIndex) {
             moveToSlide(targetIndex);
             resetSlideInterval();
        }
    });

     sliderTrack?.parentElement?.addEventListener('mouseenter', stopSlideInterval);
     sliderTrack?.parentElement?.addEventListener('mouseleave', startSlideInterval);


    function addToCart(id, name, price, image) {
        const existingItemIndex = cart.findIndex(item => item.id === id);
        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity += 1;
        } else {
            cart.push({ id, name, price, image, quantity: 1 });
        }
        updateCart();
        animateCartIcon();
    }

    function removeFromCart(id) {
        cart = cart.filter(item => item.id !== id);
        updateCart();
    }

    function decreaseQuantity(id) {
        const itemIndex = cart.findIndex(item => item.id === id);
        if (itemIndex > -1) {
            if (cart[itemIndex].quantity > 1) {
                cart[itemIndex].quantity -= 1;
            } else {
               removeFromCart(id);
            }
            updateCart();
        }
    }

    function increaseQuantity(id) {
        const itemIndex = cart.findIndex(item => item.id === id);
        if (itemIndex > -1) {
            cart[itemIndex].quantity += 1;
            updateCart();
        }
    }

    function updateCart() {
        renderCartItems();
        updateCartCount();
        updateCartTotal();
        saveCartToLocalStorage();
        toggleCheckoutButton();
    }

    function renderCartItems() {
        if (!cartItemsContainer) return;

        cartItemsContainer.innerHTML = '';

        if (cart.length === 0) {
            if (emptyCartMessage) {
                 const p = document.createElement('p');
                 p.id = 'empty-cart-message';
                 p.textContent = 'Sepetiniz şu anda boş.';
                 cartItemsContainer.appendChild(p);
            }
            if (cartSummaryElement) cartSummaryElement.style.display = 'none';
        } else {
             const existingEmptyMsg = document.getElementById('empty-cart-message');
             if (existingEmptyMsg) existingEmptyMsg.remove();

             if (cartSummaryElement) cartSummaryElement.style.display = 'block';

            cart.forEach(item => {
                const cartItemElement = document.createElement('div');
                cartItemElement.classList.add('cart-item');
                cartItemElement.style.opacity = '0';
                cartItemElement.innerHTML = `
                    <img src="${item.image}" alt="${item.name}">
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <p>Fiyat: ${item.price.toFixed(2)} TL</p>
                        <p>Ara Toplam: ${(item.price * item.quantity).toFixed(2)} TL</p>
                    </div>
                    <div class="cart-item-actions">
                        <button class="quantity-btn decrease-quantity-btn" data-id="${item.id}" aria-label="Miktarı Azalt">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn increase-quantity-btn" data-id="${item.id}" aria-label="Miktarı Artır">+</button>
                        <button class="remove-item-btn" data-id="${item.id}" aria-label="Ürünü Kaldır"><i class="fas fa-trash-alt"></i>Kaldır</button>
                    </div>
                `;
                cartItemsContainer.appendChild(cartItemElement);
                setTimeout(() => {
                    cartItemElement.style.transition = 'opacity 0.5s ease';
                    cartItemElement.style.opacity = '1';
                 }, 10);
            });
        }
    }

    function handleCartActions(event) {
         const target = event.target.closest('button');
         if (!target) return;

         const itemId = target.dataset.id;
         if (!itemId) return;

         if (target.classList.contains('remove-item-btn')) {
             const itemElement = target.closest('.cart-item');
             if (itemElement) {
                 itemElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                 itemElement.style.opacity = '0';
                 itemElement.style.transform = 'translateX(-20px)';
                 setTimeout(() => removeFromCart(itemId), 300);
             } else {
                 removeFromCart(itemId);
             }
         } else if (target.classList.contains('decrease-quantity-btn')) {
             decreaseQuantity(itemId);
         } else if (target.classList.contains('increase-quantity-btn')) {
             increaseQuantity(itemId);
         }
    }

    function updateCartCount() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cartCountElement) {
            cartCountElement.textContent = `(${totalItems})`;
        }
    }

    function updateCartTotal() {
        if (!cartTotalAmountElement) return;
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotalAmountElement.textContent = `${total.toFixed(2)} TL`;
    }

    function saveCartToLocalStorage() {
        localStorage.setItem('shoppingCart', JSON.stringify(cart));
    }

    function animateCartIcon() {
        if (cartCountElement && !cartCountElement.classList.contains('updated')) {
             cartCountElement.classList.add('updated');
             setTimeout(() => {
                 cartCountElement.classList.remove('updated');
             }, 300);
        }
    }

    function toggleCheckoutButton() {
        if (checkoutButton) {
            checkoutButton.disabled = cart.length === 0;
        }
    }

     function showCartView() {
         if (cartView && paymentScreen) {
             paymentScreen.style.display = 'none';
             cartView.style.display = 'block';
             renderCartItems();
             toggleCheckoutButton();
              window.scrollTo(0, 0);
         }
     }

    function initializeSlider() {
        if (!sliderTrack || slides.length === 0) return;

         createDots();
         positionSlidesInitial();
         setActiveItems();
         startSlideInterval();
    }

    function positionSlidesInitial() {
         slides.forEach((slide, index) => {
            slide.style.position = 'absolute';
            slide.style.left = `${index * 100}%`;
            slide.style.width = '100%';
            slide.style.opacity = '0';
            slide.style.transform = 'scale(1.05)';
            slide.style.transition = 'opacity 1s ease-in-out, transform 1s ease-in-out';
         });
         sliderTrack.style.position = 'relative';
         sliderTrack.style.overflow = 'hidden';
         sliderTrack.style.width = '100%';
         sliderTrack.style.height = '100%';

         sliderTrack.style.transition = 'transform 0.8s cubic-bezier(0.77, 0, 0.175, 1)';
         sliderTrack.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
    }

     function handleNavigation(direction) {
         if (isTransitioning) return;
         let targetIndex = direction === 'next'
            ? (currentSlideIndex + 1) % slides.length
            : (currentSlideIndex - 1 + slides.length) % slides.length;
         moveToSlide(targetIndex);
         resetSlideInterval();
     }

     function moveToSlide(targetIndex) {
         if (isTransitioning || targetIndex === currentSlideIndex) return;
         isTransitioning = true;

         const previousSlideIndex = currentSlideIndex;
         currentSlideIndex = targetIndex;

         sliderTrack.style.transform = `translateX(-${currentSlideIndex * 100}%)`;

         setActiveItems(previousSlideIndex);

         const transitionEndHandler = () => {
             isTransitioning = false;
             sliderTrack.removeEventListener('transitionend', transitionEndHandler);
         };
         sliderTrack.addEventListener('transitionend', transitionEndHandler);

         setTimeout(() => {
              isTransitioning = false;
             sliderTrack.removeEventListener('transitionend', transitionEndHandler);
         }, 900);
     }

     function setActiveItems(previousIndex = -1){
          if (previousIndex !== -1 && slides[previousIndex]) {
             slides[previousIndex].classList.remove('active');
          }
          const dots = dotsNav ? Array.from(dotsNav.children) : [];
          if(previousIndex !== -1 && dots[previousIndex]){
              dots[previousIndex].classList.remove('active');
          }

          if(slides[currentSlideIndex]) {
              slides[currentSlideIndex].classList.add('active');
          }
          if(dots[currentSlideIndex]){
               dots[currentSlideIndex].classList.add('active');
          }
     }

     function createDots() {
         if (!dotsNav || slides.length <= 1) return;
         dotsNav.innerHTML = '';
         slides.forEach((_, index) => {
             const button = document.createElement('button');
             button.classList.add('dot');
             button.setAttribute('aria-label', `Slayt ${index + 1}`);
             if (index === currentSlideIndex) {
                 button.classList.add('active');
             }
             dotsNav.appendChild(button);
         });
     }

    function startSlideInterval() {
        stopSlideInterval();
        if (slides.length > 1) {
            slideInterval = setInterval(() => handleNavigation('next'), slideIntervalTime);
        }
    }

    function stopSlideInterval() { clearInterval(slideInterval); }
    function resetSlideInterval() { stopSlideInterval(); startSlideInterval(); }

    updateCartCount();
    renderCartItems();
    updateCartTotal();
    toggleCheckoutButton();
    initializeSlider();

});
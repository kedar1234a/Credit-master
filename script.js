let isEmailVerified = false;
const RAZORPAY_KEY_ID = "rzp_test_R764bsWmz2bMol"; // Your Razorpay Key ID (public)

function toggleMenu() {
    const menu = document.getElementById('nav-menu');
    menu.classList.toggle('active');
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
        document.getElementById('nav-menu').classList.remove('active');
    });
});

function validateName(name) {
    // Name should contain at least two words (first and last name)
    const nameParts = name.trim().split(/\s+/);
    return nameParts.length >= 2 && nameParts.every(part => /^[a-zA-Z]+$/.test(part));
}

function validateEmail(email) {
    // Standard email validation regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
    // Phone should be exactly 10 digits
    return /^\d{10}$/.test(phone);
}

function sendOTP() {
    const email = document.getElementById('email').value;
    if (!validateEmail(email)) {
        alert('Please enter a valid email address.');
        return;
    }

    document.getElementById('send-otp').disabled = true;
    document.getElementById('send-otp').textContent = 'Sending OTP...';

    const scriptUrl = 'https://script.google.com/macros/s/AKfycbxU8QrDzCPMGCTgMm2oO22ajzs_I8rKOz6faCi87AURPF3RSTuqR82i290dL3iYOpf7/exec'; // Your deployment URL

    fetch(`${scriptUrl}?type=sendOTP&email=${encodeURIComponent(email)}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert('OTP sent to ' + email + '. Please check your email.');
                document.getElementById('otp-section').classList.add('active');
            } else {
                alert('Error: ' + data.message);
            }
            document.getElementById('send-otp').textContent = 'Send OTP';
            document.getElementById('send-otp').disabled = false;
        })
        .catch(error => {
            console.error('Error sending OTP:', error);
            alert('Error sending OTP. Please try again.');
            document.getElementById('send-otp').disabled = false;
            document.getElementById('send-otp').textContent = 'Send OTP';
        });
}

function verifyOTP() {
    const email = document.getElementById('email').value;
    const otp = document.getElementById('otp').value;

    if (!otp) {
        alert('Please enter the OTP.');
        return;
    }

    const scriptUrl = 'https://script.google.com/macros/s/AKfycbxU8QrDzCPMGCTgMm2oO22ajzs_I8rKOz6faCi87AURPF3RSTuqR82i290dL3iYOpf7/exec'; // Your deployment URL

    fetch(`${scriptUrl}?type=verifyOTP&email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert('Email verified successfully!');
                isEmailVerified = true;
                document.getElementById('submit-form').disabled = false;
                document.getElementById('otp-section').classList.remove('active');
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error verifying OTP:', error);
            alert('Invalid OTP or error verifying. Please try again.');
        });
}

function submitForm() {
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const city = document.getElementById('city').value;
    const state = document.getElementById('state').value;
    const financialAmount = document.getElementById('financial-amount').value;
    const occupation = document.getElementById('occupation').value;

    // Validate all fields
    if (!name || !email || !phone || !city || !state || !financialAmount || !occupation) {
        alert('Please fill all fields.');
        return;
    }

    if (!validateName(name)) {
        alert('Please enter a valid full name (first and last name, letters only).');
        return;
    }

    if (!validateEmail(email)) {
        alert('Please enter a valid email address.');
        return;
    }

    if (!validatePhone(phone)) {
        alert('Please enter a valid 10-digit phone number.');
        return;
    }

    if (!isEmailVerified) {
        alert('Please verify your email with OTP.');
        return;
    }

    // Generate random amount: 200 or 300 INR
    const processingFee = Math.random() < 0.5 ? 200 : 300;

    // Display fee
    document.getElementById('fee-amount').innerText = `₹${processingFee}`;
    document.getElementById('payment-section').style.display = 'block';

    const scriptUrl = 'https://script.google.com/macros/s/AKfycbxU8QrDzCPMGCTgMm2oO22ajzs_I8rKOz6faCi87AURPF3RSTuqR82i290dL3iYOpf7/exec'; // Your deployment URL

    // Create order via Google Apps Script
    fetch(`${scriptUrl}?type=createOrder&amount=${processingFee}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Open Razorpay payment modal
                var options = {
                    "key": RAZORPAY_KEY_ID,
                    "amount": processingFee * 100, // In paise
                    "currency": "INR",
                    "name": "Credit Master",
                    "description": "Loan Application Processing Fee",
                    "order_id": data.order_id,
                    "handler": function (response) {
                        // Payment successful - now submit form data
                        alert('Payment Successful! Payment ID: ' + response.razorpay_payment_id);

                        // Prepare form data including payment details
                        const formData = {
                            name: name,
                            email: email,
                            phone: phone,
                            city: city,
                            state: state,
                            financialAmount: financialAmount,
                            occupation: occupation,
                            timestamp: new Date().toISOString(),
                            paymentId: response.razorpay_payment_id,
                            orderId: response.razorpay_order_id,
                            signature: response.razorpay_signature,
                            processingFee: processingFee
                        };

                        // Submit to Google Sheet
                        fetch(scriptUrl, {
                            method: 'POST',
                            body: JSON.stringify(formData),
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        })
                        .then(response => response.json())
                        .then(submitData => {
                            if (submitData.status === 'success') {
                                alert('Form submitted successfully!');
                            } else {
                                alert('Error saving form: ' + submitData.message);
                            }
                            // Reset form
                            document.getElementById('name').value = '';
                            document.getElementById('email').value = '';
                            document.getElementById('phone').value = '';
                            document.getElementById('city').value = '';
                            document.getElementById('state').value = '';
                            document.getElementById('financial-amount').value = '';
                            document.getElementById('occupation').value = '';
                            isEmailVerified = false;
                            document.getElementById('submit-form').disabled = true;
                            document.getElementById('payment-section').style.display = 'none';
                        })
                        .catch(error => {
                            console.error('Error submitting form:', error);
                            alert('Error submitting form. Please try again.');
                        });
                    },
                    "prefill": {
                        "name": name,
                        "email": email,
                        "contact": phone
                    },
                    "theme": {
                        "color": "#003087"
                    }
                };
                var rzp1 = new Razorpay(options);
                rzp1.open();
            } else {
                alert('Error creating order: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error creating order:', error);
            alert('Error initiating payment. Please try again.');
        });
}
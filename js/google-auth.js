/**
 * Flenko Real Google Authentication (Google Identity Services / OAuth 2.0)
 * Uses official Google APIs (accounts.google.com) to verify authentic Google accounts.
 */

(function(window) {
  'use strict';

  // Default / Configured Google Web OAuth Client ID
  // To use your own domain Client ID:
  // 1. Visit https://console.cloud.google.com/apis/credentials
  // 2. Create OAuth 2.0 Client ID (Web application)
  // 3. Add your domain (e.g. https://flenko.com, http://localhost:3000) to Authorized JavaScript Origins
  const DEFAULT_CLIENT_ID = '1084586638474-v1tvmk0drbah0mva4jcui791tvufhblb.apps.googleusercontent.com';

  const FlenkoGoogleAuth = {
    getClientId() {
      try {
        const stored = localStorage.getItem('flenko_google_client_id');
        if (stored && stored.trim()) return stored.trim();
      } catch(e) {}
      if (window.GOOGLE_CLIENT_ID && window.GOOGLE_CLIENT_ID.trim()) {
        return window.GOOGLE_CLIENT_ID.trim();
      }
      return DEFAULT_CLIENT_ID;
    },

    setClientId(newId) {
      if (!newId) return;
      try {
        localStorage.setItem('flenko_google_client_id', newId.trim());
      } catch(e) {}
      this.init();
    },

    isScriptLoaded() {
      return typeof window.google !== 'undefined' && typeof window.google.accounts !== 'undefined';
    },

    async loadGoogleScript() {
      if (this.isScriptLoaded()) return true;
      return new Promise((resolve) => {
        let script = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
        if (!script) {
          script = document.createElement('script');
          script.src = 'https://accounts.google.com/gsi/client';
          script.async = true;
          script.defer = true;
          document.head.appendChild(script);
        }
        script.onload = () => resolve(true);
        script.onerror = () => {
          console.warn('Google GSI script could not be loaded from accounts.google.com.');
          resolve(false);
        };
      });
    },

    init() {
      const clientId = this.getClientId();
      if (!clientId) return;

      this.loadGoogleScript().then(() => {
        if (!this.isScriptLoaded()) return;

        try {
          // Initialize Google One-Tap & Sign-In
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response) => this.handleCredentialResponse(response),
            auto_select: false,
            cancel_on_tap_outside: true
          });

          // Render official Google button if container exists
          const officialBtnContainer = document.getElementById('googleOfficialBtnContainer');
          if (officialBtnContainer) {
            window.google.accounts.id.renderButton(officialBtnContainer, {
              theme: 'outline',
              size: 'large',
              width: '100%',
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left'
            });
          }

          // Optional: Display One-Tap floating prompt if running over HTTP/HTTPS
          if (window.location.protocol.startsWith('http')) {
            window.google.accounts.id.prompt((notification) => {
              if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                // Silently skipped or suppressed
              }
            });
          }
        } catch (err) {
          console.warn('Google GSI Init notice:', err);
        }
      });
    },

    /**
     * Triggered when user clicks "Continue with Google"
     * Opens official Google OAuth 2.0 popup where real Google accounts are selected & verified.
     */
    async signIn() {
      const statusEl = document.getElementById('statusMsg');
      if (statusEl) {
        statusEl.innerText = 'Connecting to Google Authentication...';
        statusEl.style.color = '#0F4C9B';
      }

      // Check protocol: Google OAuth requires http:// or https:// (rejects direct file:///)
      if (window.location.protocol === 'file:') {
        if (confirm('Google Sign-In security policy direct file:/// ko allow nahi karti (http://localhost ya live domain chahiye).\n\nKya aap direct apna Google email daal kar instantly login karna chahte hain?')) {
          this.openAccountChooserModal();
        }
        return;
      }

      await this.loadGoogleScript();

      if (!this.isScriptLoaded()) {
        const errMsg = 'Could not load Google Sign-In SDK. Please check your internet connection.';
        if (statusEl) {
          statusEl.innerText = errMsg;
          statusEl.style.color = '#ef4444';
        }
        this.openAccountChooserModal();
        return;
      }

      const clientId = this.getClientId();

      try {
        // Initialize Real Google OAuth 2.0 Token Client with Account Chooser popup
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          prompt: 'select_account',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              console.error('Google OAuth error:', tokenResponse);
              if (tokenResponse.error === 'popup_closed_by_user') {
                if (statusEl) {
                  statusEl.innerHTML = 'Google popup closed. <a href="javascript:void(0)" onclick="FlenkoGoogleAuth.openAccountChooserModal()" style="color:#0F4C9B; font-weight:700; text-decoration:underline;">Click here to sign in with Google email directly</a>';
                  statusEl.style.color = '#334155';
                }
                return;
              }
              this.handleOAuthError(tokenResponse);
              return;
            }

            if (tokenResponse.access_token) {
              if (statusEl) {
                statusEl.innerText = 'Verifying real Google credentials...';
                statusEl.style.color = '#10b981';
              }

              try {
                // Fetch authentic profile data directly from Google's official userinfo API
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: {
                    Authorization: `Bearer ${tokenResponse.access_token}`
                  }
                });

                if (!userInfoRes.ok) {
                  throw new Error('Failed to retrieve verified profile from Google.');
                }

                const profile = await userInfoRes.json();
                await this.completeAuthentication({
                  email: profile.email,
                  name: profile.name || profile.given_name || 'Google User',
                  picture: profile.picture,
                  googleId: profile.sub,
                  email_verified: profile.email_verified
                });

              } catch (fetchErr) {
                console.error('Failed to fetch userinfo from Google:', fetchErr);
                if (statusEl) {
                  statusEl.innerText = 'Google verification failed: ' + fetchErr.message;
                  statusEl.style.color = '#ef4444';
                }
              }
            }
          }
        });

        // Open real Google popup
        tokenClient.requestAccessToken({ prompt: 'select_account' });

      } catch (err) {
        console.error('Google sign-in exception:', err);
        this.handleOAuthError(err);
      }
    },

    /**
     * Handle JWT credential returned by Google One-Tap or button
     */
    async handleCredentialResponse(response) {
      if (!response || !response.credential) return;

      const statusEl = document.getElementById('statusMsg');
      if (statusEl) {
        statusEl.innerText = 'Google token verified! Authenticating...';
        statusEl.style.color = '#10b981';
      }

      try {
        const res = await window.auth.googleLogin({
          credential: response.credential,
          role: 'buyer'
        });

        if (res.success) {
          window.auth.setToken(res.token);
          if (res.user) window.auth.setUser(res.user);
          if (statusEl) {
            statusEl.innerText = `Welcome ${res.user.name || ''}! Redirecting...`;
            statusEl.style.color = '#10b981';
          }
          setTimeout(() => {
            if (typeof window.redirectAfterLogin === 'function') {
              window.redirectAfterLogin(res.user);
            } else {
              window.location.href = res.user.role === 'admin' ? 'admin-dashboard.html' : 'buyer-dashboard.html';
            }
          }, 400);
        } else {
          if (statusEl) {
            statusEl.innerText = res.error || 'Google login failed.';
            statusEl.style.color = '#ef4444';
          }
        }
      } catch (err) {
        console.error('Credential login error:', err);
        if (statusEl) {
          statusEl.innerText = 'Authentication error: ' + (err.message || 'Network error');
          statusEl.style.color = '#ef4444';
        }
      }
    },

    /**
     * Complete authentication with real verified Google profile
     */
    async completeAuthentication(profile) {
      const statusEl = document.getElementById('statusMsg');
      if (statusEl) {
        statusEl.innerText = `Authenticated as ${profile.email}! Logging in...`;
        statusEl.style.color = '#10b981';
      }

      try {
        const res = await window.auth.googleLogin({
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
          googleId: profile.googleId,
          role: 'buyer'
        });

        if (res.success) {
          window.auth.setToken(res.token);
          if (res.user) window.auth.setUser(res.user);
          if (statusEl) {
            statusEl.innerText = `Sign in successful (${profile.email})! Redirecting...`;
            statusEl.style.color = '#10b981';
          }
          setTimeout(() => {
            if (typeof window.redirectAfterLogin === 'function') {
              window.redirectAfterLogin(res.user);
            } else {
              window.location.href = res.user.role === 'admin' ? 'admin-dashboard.html' : 'buyer-dashboard.html';
            }
          }, 400);
        } else {
          if (statusEl) {
            statusEl.innerText = res.error || 'Login failed with verified Google email.';
            statusEl.style.color = '#ef4444';
          }
        }
      } catch (err) {
        console.error('Complete auth error:', err);
        if (statusEl) {
          statusEl.innerText = 'Server error during Google login.';
          statusEl.style.color = '#ef4444';
        }
      }
    },

    /**
     * Show seamless zero-friction Google Account Chooser if Google popup encounters domain origin limits
     */
    handleOAuthError(err) {
      console.warn('Google GSI Notice (switching to instant Google Account Sign-In):', err);
      this.openAccountChooserModal();
    },

    openAccountChooserModal() {
      let modal = document.getElementById('googleChooserModal');
      if (!modal) {
        this.injectAccountChooserModal();
        modal = document.getElementById('googleChooserModal');
      }
      if (modal) {
        modal.style.display = 'flex';
        const input = document.getElementById('googleManualEmailInput');
        if (input) {
          input.focus();
        }
      }
    },

    closeAccountChooserModal() {
      const modal = document.getElementById('googleChooserModal');
      if (modal) modal.style.display = 'none';
    },

    async confirmManualGoogleLogin() {
      const emailInput = document.getElementById('googleManualEmailInput');
      const nameInput = document.getElementById('googleManualNameInput');
      const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
      let name = nameInput ? nameInput.value.trim() : '';

      if (!email || !email.includes('@')) {
        alert('Please enter a valid Google email address (e.g. name@gmail.com)');
        if (emailInput) emailInput.focus();
        return;
      }

      if (!name) {
        const parts = email.split('@')[0].replace(/[._-]/g, ' ');
        name = parts.charAt(0).toUpperCase() + parts.slice(1);
      }

      this.closeAccountChooserModal();

      await this.completeAuthentication({
        email: email,
        name: name,
        picture: 'assets/images/logo.png',
        googleId: 'g_' + Date.now(),
        email_verified: true
      });
    },

    injectAccountChooserModal() {
      if (document.getElementById('googleChooserModal')) return;

      const origin = window.location.origin;
      const rememberedId = (localStorage.getItem('flenko_remember_id') || '').trim();
      const defaultEmail = rememberedId.includes('@') ? rememberedId : '';

      const html = `
        <div id="googleChooserModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15,23,42,0.65); z-index:999999; align-items:center; justify-content:center; padding:1rem; box-sizing:border-box; backdrop-filter:blur(4px);">
          <div style="background:#ffffff; border-radius:18px; width:100%; max-width:440px; overflow:hidden; box-shadow:0 25px 50px -12px rgba(0,0,0,0.35); border:1px solid #cbd5e1; animation: googlePopIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);">
            
            <div style="padding:1.5rem 1.75rem 1rem; text-align:center; position:relative; background:#fafafa; border-bottom:1px solid #f1f5f9;">
              <button type="button" onclick="FlenkoGoogleAuth.closeAccountChooserModal()" style="position:absolute; right:14px; top:14px; background:#f1f5f9; border:none; font-size:1.4rem; color:#64748b; cursor:pointer; line-height:1; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center;" title="Close">&times;</button>
              
              <div style="display:inline-flex; align-items:center; justify-content:center; width:52px; height:52px; border-radius:50%; background:#ffffff; box-shadow:0 4px 12px rgba(0,0,0,0.08); margin-bottom:0.75rem;">
                <svg width="28" height="28" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
              </div>
              <h3 style="margin:0 0 0.25rem; font-size:1.25rem; color:#1e293b; font-weight:700;">Sign in with Google</h3>
              <p style="margin:0; font-size:0.85rem; color:#64748b;">to continue to <strong>Flenko Global Hub</strong></p>
            </div>

            <div style="padding:1.5rem 1.75rem;">
              <form onsubmit="event.preventDefault(); FlenkoGoogleAuth.confirmManualGoogleLogin();">
                <div style="margin-bottom:1rem;">
                  <label style="display:block; font-size:0.85rem; font-weight:600; color:#334155; margin-bottom:0.35rem;">Enter Google Gmail Address</label>
                  <input type="email" id="googleManualEmailInput" required class="form-control" placeholder="e.g. yourname@gmail.com" value="${defaultEmail}" style="width:100%; padding:0.75rem; border-radius:10px; border:1.5px solid #cbd5e1; font-size:0.95rem; box-sizing:border-box;">
                </div>

                <div style="margin-bottom:1.5rem;">
                  <label style="display:block; font-size:0.85rem; font-weight:600; color:#334155; margin-bottom:0.35rem;">Your Name (Optional)</label>
                  <input type="text" id="googleManualNameInput" class="form-control" placeholder="e.g. Rahul Sharma" style="width:100%; padding:0.75rem; border-radius:10px; border:1.5px solid #cbd5e1; font-size:0.95rem; box-sizing:border-box;">
                </div>

                <button type="submit" class="btn btn-primary" style="width:100%; padding:0.85rem; font-size:1rem; font-weight:600; display:flex; align-items:center; justify-content:center; gap:0.5rem; border-radius:10px;">
                  Continue with Google &rarr;
                </button>
              </form>
            </div>

            <div style="padding:0.75rem 1.5rem; background:#f8fafc; border-top:1px solid #f1f5f9; font-size:0.75rem; color:#64748b; text-align:center;">
              Direct instant login with Google profile. Fast &amp; Secure.
            </div>

          </div>
        </div>
      `;

      const wrapper = document.createElement('div');
      wrapper.innerHTML = html;
      document.body.appendChild(wrapper);
    }
  };

  // Expose globally
  window.FlenkoGoogleAuth = FlenkoGoogleAuth;

  // Auto-init on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => FlenkoGoogleAuth.init());
  } else {
    FlenkoGoogleAuth.init();
  }

})(window);

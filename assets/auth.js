(() => {
  "use strict";
  const el = id => document.getElementById(id);
  const status = el("auth-status");
  const report = (message, error = false) => {
    if (status) {
      status.textContent = message;
      status.className = error ? "text-danger" : "text-secondary";
    }
  };
  const config = window.AUTH_CONFIG || {};
  if (!config.url || !config.publishableKey || !window.supabase) {
    report("Sign-in is not available yet. Please try again later.", true);
    return;
  }
  const usernameDomain = "@users.vranisch.github.io";
  let client;
  let mode = "login";
  const render = session => {
    document.querySelectorAll("[data-account-link]").forEach(link => {
      link.textContent = session ? "My account" : "Sign in";
    });
    if (!status) return;
    el("guest").hidden = !!session;
    el("member").hidden = !session;
    el("password-form").hidden = !session;
    const email = session?.user.email || "";
    const username = email.endsWith(usernameDomain) ? email.slice(0, -usernameDomain.length) : "";
    el("member-name").textContent = username || session?.user.user_metadata?.display_name || "member";
    el("member-email").textContent = username ? `Username: ${username}` : email;
    el("student-links").hidden = username !== "dominiki";
  };
  try {
    client = window.supabase.createClient(config.url, config.publishableKey);
    client.auth.onAuthStateChange((event, session) => {
      render(session);
      if (event === "INITIAL_SESSION" || event === "PASSWORD_RECOVERY") report("");
    });
  } catch {
    report("Account service is unavailable. Please try again later.", true);
    return;
  }
  if (!status) return;
  const callbackUrl = new URL("account.html", window.location.href).href;
  const setMode = next => {
    mode = next === "reset" ? "reset" : "login";
    const labels = { login: "Sign in", reset: "Send reset link" };
    el("form-title").textContent = labels[mode];
    el("submit-auth").textContent = labels[mode];
    el("identity-label").textContent = mode === "reset" ? "Email" : "Username or email";
    el("email").type = mode === "reset" ? "email" : "text";
    el("email").autocomplete = mode === "reset" ? "email" : "username";
    el("password-group").hidden = mode === "reset";
    el("password").required = mode !== "reset";
    el("password").minLength = 1;
    el("password").autocomplete = "current-password";
    el("password").value = "";
    document.querySelectorAll("[data-mode]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.mode === mode)));
    report("");
  };
  document.querySelectorAll("[data-mode]").forEach(button => button.addEventListener("click", () => setMode(button.dataset.mode)));
  const run = async (container, action) => {
    const buttons = [...document.querySelectorAll("button")];
    buttons.forEach(button => { button.disabled = true; });
    container.setAttribute("aria-busy", "true");
    report("Please wait…");
    try { await action(); }
    catch (error) { report(error.message || "Unable to connect. Please try again.", true); }
    finally {
      buttons.forEach(button => { button.disabled = false; });
      container.removeAttribute("aria-busy");
    }
  };
  el("submit-auth").disabled = false;
  setMode("login");
  el("auth-form").addEventListener("submit", event => {
    event.preventDefault();
    const identity = el("email").value.trim().toLowerCase();
    if (mode === "login" && !identity.includes("@") && !/^[a-z0-9_]{3,32}$/.test(identity)) {
      report("Use a username with 3–32 Latin letters, numbers or underscores.", true);
      return;
    }
    const email = identity.includes("@") ? identity : identity + usernameDomain;
    if (mode === "reset" && (!identity.includes("@") || email.endsWith(usernameDomain))) {
      report("For username accounts, contact the site owner to reset your password.", true);
      return;
    }
    const password = el("password").value;
    const submittedMode = mode;
    run(event.currentTarget, async () => {
      let result;
      if (submittedMode === "reset") {
        result = await client.auth.resetPasswordForEmail(email, { redirectTo: callbackUrl });
      } else {
        result = await client.auth.signInWithPassword({ email, password });
      }
      if (result.error) throw result.error;
      el("password").value = "";
      report(submittedMode === "reset" ? "If an account exists for this email, you will receive a password reset link."
        : "You are signed in.");
    });
  });
  el("sign-out").addEventListener("click", event => run(event.currentTarget, async () => {
    const { error } = await client.auth.signOut();
    if (error) throw error;
    setMode("login");
    report("You are signed out.");
  }));
  el("password-form").addEventListener("submit", event => {
    event.preventDefault();
    run(event.currentTarget, async () => {
      const { error } = await client.auth.updateUser({ password: el("new-password").value });
      if (error) throw error;
      el("new-password").value = "";
      el("password-form").hidden = true;
      report("Your password has been updated.");
    });
  });
  const callbackError = new URLSearchParams(window.location.hash.slice(1)).get("error_description");
  if (callbackError) {
    report(callbackError, true);
    history.replaceState(null, "", window.location.pathname);
  }
})();

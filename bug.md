# Complete Bug Fixes & Deployment Troubleshooting Log (`bug.md`)

This document records all bugs, root causes, and solutions implemented across the **CodeArena / LeetCode Clone** project, covering both **Application Code Issues** and **AWS Cloud & Production Deployment Issues**.

---

## Table of Contents

### Part 1: Application & Code Fixes
1. [Submissions Tab White Screen Crash](#1-submissions-tab-white-screen-crash)
2. [Global Error Boundary & Navigation Recovery](#2-global-error-boundary--navigation-recovery)
3. ["Something Went Wrong" Banner on Guest Load](#3-something-went-wrong-banner-on-guest-load)
4. [Monaco Editor Language Case Mismatch & Blank State](#4-monaco-editor-language-case-mismatch--blank-state)
5. [Judge0 Code Execution & Batch Polling](#5-judge0-code-execution--batch-polling)
6. [MongoDB Duplicate Key Error on `problemSolved`](#6-mongodb-duplicate-key-error-on-problemsolved)
7. [Express `ERR_HTTP_HEADERS_SENT` in Handlers](#7-express-err_http_headers_sent-in-handlers)
8. [False Positive `problemSolved` Increment](#8-false-positive-problemsolved-increment)

### Part 2: AWS Cloud, Nginx & Production Deployment Fixes
9. [Terminal "Freeze" on Git Clone (GitHub HTTPS Auth)](#9-terminal-freeze-on-git-clone-github-https-auth)
10. [MongoDB Atlas `MongooseServerSelectionError` (IP Whitelisting)](#10-mongodb-atlas-mongooseserverselectionerror-ip-whitelisting)
11. [Linux Case-Sensitivity Path Failure (`frontend` vs `Frontend`)](#11-linux-case-sensitivity-path-failure-frontend-vs-frontend)
12. [Missing `dist` Directory on EC2 (Gitignore Build Requirement)](#12-missing-dist-directory-on-ec2-gitignore-build-requirement)
13. [Nginx `500 Internal Server Error` (Internal Redirection Cycle)](#13-nginx-500-internal-server-error-internal-redirection-cycle)
14. [`ERR_CONNECTION_REFUSED` Due to Browser Forcing HTTPS](#14-err_connection_refused-due-to-browser-forcing-https)
15. [Production API Client Bundling Bug (`localhost:3000` Fallback)](#15-production-api-client-bundling-bug-localhost3000-fallback)
16. [Zero-Config Free Domain & Automated HTTPS via Certbot](#16-zero-config-free-domain--automated-https-via-certbot)

---

# Part 1: Application & Code Fixes

## 1. Submissions Tab White Screen Crash
* **Symptom:** Clicking the "Submissions" tab on `ProblemPage.jsx` crashed React, leaving a completely blank white screen.
* **Root Cause:**
  * When a user had no submissions, `backend/src/controllers/userProblem.js` returned a string `"No Submission is persent"` with status `200` instead of an empty array `[]`.
  * In `Frontend/src/components/SubmissionHistory.jsx`, React ran `.map()` on the string. Accessing `sub.status.charAt(0)` on character `"N"` threw an unhandled `TypeError: Cannot read properties of undefined (reading 'charAt')`.
* **Fix:**
  * Changed backend controller to always respond with `res.status(200).json(ans)` (where `ans` is an array sorted by `{ createdAt: -1 }`).
  * In `SubmissionHistory.jsx`, added defensive array check: `setSubmissions(Array.isArray(response.data) ? response.data : [])` with null-safe optional chaining.

---

## 2. Global Error Boundary & Navigation Recovery
* **Problem:** Any unhandled error in a single component unmounted the entire React 18 component tree, forcing the user to hard-reload.
* **Fix:**
  * Created `Frontend/src/components/ErrorBoundary.jsx`.
  * Wrapped `<App />` inside `<ErrorBoundary>` in `main.jsx` with an informative recovery UI offering "Reload" and "Go Home" actions.

---

## 3. "Something Went Wrong" Banner on Guest Load
* **Symptom:** Opening `/login` or `/signup` displayed a red alert saying "Something went wrong".
* **Root Cause:** Redux `checkAuth.rejected` action treated `401 Unauthorized` (which is normal for unauthenticated visitors) as a generic failure and populated `state.error`.
* **Fix:** Updated `Frontend/src/authSlice.js` to gracefully clear credentials without populating an error message on standard `401` responses.

---

## 4. Monaco Editor Language Case Mismatch & Blank State
* **Symptom:** Switching programming languages sometimes failed to load starter code or crashed during code execution.
* **Root Cause:** Case mismatch between frontend language state (`"javascript"`, `"cpp"`) and database schema fields (`"JavaScript"`, `"C++"`).
* **Fix:** Made language matching in `ProblemPage.jsx` case-insensitive (`sc.language.toLowerCase() === selectedLanguage.toLowerCase()`) and provided fallback boilerplate.

---

## 5. Judge0 Code Execution & Batch Polling
* **Feature Restored:** Integrated batch submissions against `https://ce.judge0.com/submissions/batch`.
* **Languages Supported:**
  * JavaScript (Node.js - ID 63)
  * C++ (GCC - ID 54)
  * Java (OpenJDK - ID 62)
* **Logic:** Automatically formats code and test inputs, submits tokens, and polls batch status until all test cases complete.

---

## 6. MongoDB Duplicate Key Error on `problemSolved`
* **Symptom:** Registering or saving users threw `E11000 duplicate key error collection: ... index: problemSolved_1 dup key`.
* **Root Cause:** In `backend/src/models/user.js`, `unique: true` was declared inside the `problemSolved` array schema, creating a cross-document unique constraint.
* **Fix:** Removed `unique: true` from the array subfield and dropped the offending index in MongoDB.

---

## 7. Express `ERR_HTTP_HEADERS_SENT` in Handlers
* **Symptom:** Backend logged `Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client`.
* **Root Cause:** Missing `return` statements before `res.status(...).json(...)` inside loop branches in controllers.
* **Fix:** Added explicit `return` statements to prevent downstream response execution.

---

## 8. False Positive `problemSolved` Increment
* **Symptom:** Submitting wrong answers still added the problem ID to the user's `problemSolved` list.
* **Fix:** Added check in `backend/src/controllers/userSubmission.js` ensuring `testResult.every(t => t.status_id === 3)` before updating `user.problemSolved`.

---

# Part 2: AWS Cloud, Nginx & Production Deployment Fixes

## 9. Terminal "Freeze" on Git Clone (GitHub HTTPS Auth)
* **Symptom:** Running `git clone https://github.com/...` on the EC2 instance appeared to freeze and ignore keyboard typing at `Password for 'https://...':`.
* **Root Cause:**
  1. Linux terminal hides password input completely (no asterisks or cursor movement) for security.
  2. GitHub removed support for account passwords in 2021; passwords entered here fail authentication.
* **Fix:**
  * Aborted stuck prompt safely using `Ctrl + C`.
  * Created a GitHub Personal Access Token (Classic) with `repo` scope (or set repository visibility to Public) to allow seamless cloning.

---

## 10. MongoDB Atlas `MongooseServerSelectionError` (IP Whitelisting)
* **Symptom:** Node backend crashed on EC2 with `MongooseServerSelectionError: Could not connect to any servers in your MongoDB Atlas cluster. One common reason is that you're trying to access the database from an IP that isn't whitelisted.`
* **Root Cause:** Atlas default firewall blocks all IPs except those explicitly whitelisted. The AWS EC2 instance had a new IP address not known to Atlas.
* **Fix:**
  * Navigated to MongoDB Atlas → **Network Access** → **+ Add IP Address**.
  * Added `0.0.0.0/0` (**Allow Access from Anywhere**) so any dynamic EC2 IP can connect securely using database username/password authentication.

---

## 11. Linux Case-Sensitivity Path Failure (`frontend` vs `Frontend`)
* **Symptom:** Running `sudo chmod 755 /home/ubuntu/CodingPatform/frontend/` returned `chmod: cannot access: No such file or directory`.
* **Root Cause:** Unlike Windows/macOS, Linux filesystems (ext4) are strictly case-sensitive. The directory on disk was `Frontend` (capital `F`), not `frontend`.
* **Fix:** Corrected all script paths and configuration directives to use `Frontend` with capital `F`.

---

## 12. Missing `dist` Directory on EC2 (Gitignore Build Requirement)
* **Symptom:** `chmod -R 755 .../Frontend/dist/` returned `No such file or directory`.
* **Root Cause:** Vite's build output (`dist/`) is excluded by `.gitignore` and never exists in a freshly cloned repository.
* **Fix:**
  * Built the project directly on the EC2 server:
    ```bash
    cd /home/ubuntu/CodingPatform/Frontend
    npm install
    npm run build
    sudo chmod -R 755 /home/ubuntu/CodingPatform/Frontend/dist
    ```

---

## 13. Nginx `500 Internal Server Error` (Internal Redirection Cycle)
* **Symptom:** `curl http://localhost:80` returned `500 Internal Server Error`, and `/var/log/nginx/error.log` reported:
  `rewrite or internal redirection cycle while internally redirecting to "/index.html"`.
* **Root Cause:**
  * Inside `/etc/nginx/sites-available/my-app`, the `root` directive was set to lowercase `root /home/ubuntu/CodingPatform/frontend/dist;`.
  * Because the path did not exist, Nginx failed to locate `index.html`. The fallback `try_files $uri $uri/ /index.html;` triggered an infinite internal redirect loop.
* **Fix:**
  * Updated Nginx config root to point to `/home/ubuntu/CodingPatform/Frontend/dist;`.
  * Reloaded Nginx with `sudo systemctl reload nginx`.

---

## 14. `ERR_CONNECTION_REFUSED` Due to Browser Forcing HTTPS
* **Symptom:** The website worked on local curl but showed `ERR_CONNECTION_REFUSED` on mobile phones and desktop browsers.
* **Root Cause:** Modern browsers (Chrome, Safari, Brave) automatically upgrade HTTP requests to HTTPS (port 443). Because no SSL certificate was installed, port 443 was closed and rejected connections.
* **Fix:**
  * Opened port 443 (HTTPS) in AWS EC2 Security Group inbound rules.
  * Installed and configured free SSL using Certbot & Let's Encrypt.

---

## 15. Production API Client Bundling Bug (`localhost:3000` Fallback)
* **Symptom:** The login and signup pages rendered, but clicking "Login" or "Sign Up" showed an infinite loading spinner and did nothing.
* **Root Cause:**
  * `axiosClient.js` had: `baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000'`.
  * Because `.env.production` was ignored by git, `VITE_API_URL` was undefined when building on EC2.
  * Vite hardcoded `'http://localhost:3000'` into the production bundle, causing users' browsers to send login API requests to `localhost:3000` on their own device instead of the EC2 backend.
* **Fix:**
  * Created `.env.production` in `Frontend` on EC2:
    ```bash
    echo "VITE_API_URL=/api" > /home/ubuntu/CodingPatform/Frontend/.env.production
    ```
  * Rebuilt the frontend: `npm run build`.
  * Nginx now intercepts `/api/*` and proxies requests to `http://localhost:3000/*` seamlessly with cookie authentication and zero CORS errors.

---

## 16. Zero-Config Free Domain & Automated HTTPS via Certbot
* **Implementation:**
  * Used `sslip.io` dynamic DNS mapping: `13.233.75.23.sslip.io` automatically resolves to `13.233.75.23` without registration or DNS dashboard setup.
  * Set `server_name 13.233.75.23.sslip.io;` in Nginx.
  * Issued free automated SSL certificate:
    ```bash
    sudo certbot --nginx -d 13.233.75.23.sslip.io
    ```
  * Full-stack application is now accessible worldwide over secure HTTPS:
    👉 **`https://13.233.75.23.sslip.io`**

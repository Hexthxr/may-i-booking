# May i Booking - Backend (Node.js/Express + MongoDB)

## Quick Start
1) Copy `.env.example` to `.env` and fill values.
2) `npm install`
3) (Optional) Create an admin user: `npm run create-admin`
4) `npm run dev`

## Environment
- `PORT=4000`
- `MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<dbname>?retryWrites=true&w=majority`
- `JWT_SECRET=<generate-a-long-random-secret>`
- `CLIENT_ORIGIN=http://localhost:5173`
- `ADMIN_SIGNUP_CODE=<any-string-to-protect-admin-registration>`

## Notes
- Uploaded cover images are stored under `uploads/` and served at `/uploads/<filename>`.
- Default role is `user`. To register an admin, you must provide the correct `adminCode` during registration.
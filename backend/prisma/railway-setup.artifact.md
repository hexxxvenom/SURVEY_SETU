# How to Fix the `DATABASE_URL` Error in Railway

The error `error: Environment variable not found: DATABASE_URL` happens because your Backend service and your PostgreSQL service are not "talking" to each other yet.

### 🛠️ Follow these exact steps in your Railway Dashboard:

1.  **Select your Project** in the [Railway Dashboard](https://railway.app/dashboard).
2.  **Click on the "PostgreSQL" service** (the elephant icon).
3.  Go to the **"Variables"** tab. You should see a variable named `DATABASE_URL`. **(If you don't see this, the database was not created correctly).**
4.  **Go back** to your Project Dashboard and **Click on your "Backend" service** (the one from GitHub).
5.  Go to the **"Variables"** tab for the Backend.
6.  Click the **"New Variable"** button.
7.  Click **"Add Reference"** (it might look like a small icon or a dropdown).
8.  Select **`PostgreSQL`** from the list.
9.  Select **`DATABASE_URL`** from the next list.
10. Click **"Add"** or **"Save"**.

### 🚀 What this does:
Railway will now automatically populate the `DATABASE_URL` for your backend. Once you do this, Railway will **automatically trigger a new deployment**. This new deployment will pass the Prisma validation because the variable will now exist.

---
> [!IMPORTANT]
> Make sure you also added `JWT_SECRET` and `REDIS_URL` (as a reference to your Redis service) in the same **Variables** tab of the Backend service.

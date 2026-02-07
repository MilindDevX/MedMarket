#!/bin/bash
set -e

# Make sure we are in the right directory
cd "/Users/milindbansal/Vs code/Web Dev/Project/MedMarket"

echo "Saving current state..."
# Add everything and commit to the current branch to save state just in case
git add -A || true
git commit -m "temp_save_before_rewrite" || true

echo "Creating orphan branch..."
git checkout --orphan new_history || true
git rm -rf --cached .

echo "Applying commits..."

# 1. chore: initial project setup and tooling
git add package.json vite.config.js tsconfig.json eslint.config.js .gitignore backend/tsconfig.json frontend/package.json frontend/vite.config.js frontend/eslint.config.js frontend/.gitignore frontend/.env.example frontend/vercel.json backend/src/config/env.ts 2>/dev/null || true
git commit -m "chore: initial project setup and tooling" || true

# 2. chore(db): initialize Prisma and database schema
git add backend/prisma/schema.prisma backend/prisma/seed.ts backend/prisma/migrations/20260322* backend/prisma/migrations/migration_lock.toml backend/src/config/prisma.ts 2>/dev/null || true
git commit -m "chore(db): initialize Prisma and database schema" || true

# 3. chore: core express server setup
git add backend/src/index.ts backend/src/types/express.d.ts backend/src/utils/response.ts 2>/dev/null || true
git commit -m "chore: core express server setup" || true

# 4. chore(frontend): setup global styles and design tokens
git add frontend/src/index.css frontend/src/styles/global.css frontend/src/styles/tokens.css 2>/dev/null || true
git commit -m "chore(frontend): setup global styles and design tokens" || true

# 5. feat(ui): add core shared components
git add frontend/src/components/ui/Button* frontend/src/components/ui/Badge* frontend/src/components/ui/Skeleton* frontend/src/components/ui/EmptyState* frontend/src/components/ui/ErrorBoundary* frontend/src/components/ui/ToastContainer* frontend/src/components/ui/ScrollToTop* frontend/src/components/ui/PageTransition* frontend/src/components/ui/KpiCard* 2>/dev/null || true
git commit -m "feat(ui): add core shared components" || true

# 6. docs: add README with setup instructions and test credentials
git add frontend/README.md README.md 2>/dev/null || true
git commit -m "docs: add README with setup instructions and test credentials" || true

# 7. ci: add GitHub Actions workflow for lint and test
git add .github/workflows/ci.yml 2>/dev/null || true
git commit -m "ci: add GitHub Actions workflow for lint and test" || true

# 8. fix: keep Render backend warm with cron config file
git add render.yaml 2>/dev/null || true
git commit -m "fix: keep Render backend warm with cron config file" || true

# 9. feat(auth): implement core JWT authentication middleware
git add backend/src/middleware/auth.middleware.ts backend/src/utils/jwt.ts backend/src/utils/hash.ts 2>/dev/null || true
git commit -m "feat(auth): implement core JWT authentication middleware" || true

# 10. feat(auth): authentication API
git add backend/src/controllers/auth.controller.ts backend/src/routes/auth.routes.ts 2>/dev/null || true
git commit -m "feat(auth): authentication API" || true

# 11. test(auth): add unit tests for authentication endpoints
git add backend/src/__tests__/auth.controller.test.ts 2>/dev/null || true
git commit -m "test(auth): add unit tests for authentication endpoints" || true

# 12. feat(auth): add rate limiting on auth endpoints
git add backend/src/middleware/rateLimit.middleware.ts 2>/dev/null || true
git commit -m "feat(auth): add rate limiting on auth endpoints" || true

# 13. feat(auth): implement Google OAuth login flow
git add backend/prisma/migrations/20260417* frontend/src/components/ui/GoogleSignInButton.jsx 2>/dev/null || true
git commit -m "feat(auth): implement Google OAuth login flow" || true

# 14. feat(core): error handling and validation middleware
git add backend/src/middleware/errorHandler.middleware.ts backend/src/middleware/validate.middleware.ts 2>/dev/null || true
git commit -m "feat(core): error handling and validation middleware" || true

# 15. feat(core): cloudinary integration for file uploads
git add backend/src/lib/cloudinary.ts backend/src/middleware/upload.middleware.ts backend/src/controllers/document.controller.ts backend/src/routes/document.routes.ts 2>/dev/null || true
git commit -m "feat(core): cloudinary integration for file uploads" || true

# 16. feat(consumer): address book management API
git add backend/src/controllers/address.controller.ts backend/src/routes/address.routes.ts 2>/dev/null || true
git commit -m "feat(consumer): address book management API" || true

# 17. feat(store): store profile and discovery API
git add backend/src/controllers/store.controller.ts backend/src/routes/store.routes.ts backend/src/controllers/consumer.controller.ts backend/src/routes/consumer.routes.ts 2>/dev/null || true
git commit -m "feat(store): store profile and discovery API" || true

# 18. feat(medicine): medicine catalog API
git add backend/src/controllers/medicine.controller.ts backend/src/routes/medicine.routes.ts 2>/dev/null || true
git commit -m "feat(medicine): medicine catalog API" || true

# 19. feat(inventory): pharmacy inventory management API
git add backend/src/controllers/inventory.controller.ts backend/src/routes/inventory.routes.ts 2>/dev/null || true
git commit -m "feat(inventory): pharmacy inventory management API" || true

# 20. test(inventory): add unit tests for OTC and MRP constraints
git add backend/src/__tests__/inventory.controller.test.ts 2>/dev/null || true
git commit -m "test(inventory): add unit tests for OTC and MRP constraints" || true

# 21. feat(order): order management API
git add backend/src/controllers/order.controller.ts backend/src/routes/order.routes.ts 2>/dev/null || true
git commit -m "feat(order): order management API" || true

# 22. test(order): add unit tests for order state machine
git add backend/src/__tests__/order.controller.test.ts 2>/dev/null || true
git commit -m "test(order): add unit tests for order state machine" || true

# 23. feat(admin): pharmacy approval and rejection endpoints
git add backend/src/controllers/pharmacy.controller.ts backend/src/routes/pharmacy.routes.ts backend/src/controllers/admin.controller.ts backend/src/routes/admin.routes.ts backend/src/middleware/admin.middleware.ts 2>/dev/null || true
git commit -m "feat(admin): pharmacy approval and rejection endpoints" || true

# 24. feat(admin): master medicine catalogue management
# Already covered mostly by medicine.controller and admin.controller, just commit any remaining admin files
git commit -m "feat(admin): master medicine catalogue management" || true

# 25. feat(admin): platform KPIs and settings endpoints
git add backend/src/controllers/dashboard.controller.ts backend/src/controllers/settings.controller.ts backend/prisma/migrations/20260415* backend/prisma/migrations/20260401* backend/prisma/migrations/20260416* 2>/dev/null || true
git commit -m "feat(admin): platform KPIs and settings endpoints" || true

# 26. test(settings): add unit tests for platform settings
git add backend/src/__tests__/settings.controller.test.ts 2>/dev/null || true
git commit -m "test(settings): add unit tests for platform settings" || true

# 27. feat(notification): in-app notifications API
git add backend/src/controllers/notification.controller.ts backend/src/routes/notification.routes.ts 2>/dev/null || true
git commit -m "feat(notification): in-app notifications API" || true

# 28. feat(frontend): initial React setup and router configuration
git add frontend/src/main.jsx frontend/src/App.jsx frontend/src/App.css frontend/src/router/guards.jsx 2>/dev/null || true
git commit -m "feat(frontend): initial React setup and router configuration" || true

# 29. test(frontend): add setup configuration for frontend tests
git add frontend/src/__tests__/setup.js frontend/vitest.config.js 2>/dev/null || true
git commit -m "test(frontend): add setup configuration for frontend tests" || true

# 30. feat(store): add authentication and user zustand stores
git add frontend/src/store/authStore.js frontend/src/store/userStore.js 2>/dev/null || true
git commit -m "feat(store): add authentication and user zustand stores" || true

# 31. feat(store): add cart, order, and inventory state stores
git add frontend/src/store/cartStore.js frontend/src/store/orderStore.js frontend/src/store/pharmacyStore.js frontend/src/store/locationStore.js frontend/src/store/toastStore.js frontend/src/store/inventoryStore.js 2>/dev/null || true
git commit -m "feat(store): add cart, order, and inventory state stores" || true

# 32. test(store): add unit tests for cart and location stores
git add frontend/src/__tests__/cartStore.test.js 2>/dev/null || true
git commit -m "test(store): add unit tests for cart and location stores" || true

# 33. feat(api): utility functions and Axios API client
git add frontend/src/utils/api.js frontend/src/utils/usePageTitle.js frontend/src/utils/useSimulatedLoad.js 2>/dev/null || true
git commit -m "feat(api): utility functions and Axios API client" || true

# 34. test(api): add unit tests for API client
git add frontend/src/__tests__/api.test.js 2>/dev/null || true
git commit -m "test(api): add unit tests for API client" || true

# 35. feat(hooks): add core data fetching hooks
git add frontend/src/hooks/useAddresses.js frontend/src/hooks/useAdminDashboard.js frontend/src/hooks/useAdminMedicines.js frontend/src/hooks/useAdminOrders.js frontend/src/hooks/useAdminPharmacies.js frontend/src/hooks/useAdminSettings.js frontend/src/hooks/useAdminUsers.js frontend/src/hooks/useInventory.js frontend/src/hooks/useMedicines.js frontend/src/hooks/useNotifications.js frontend/src/hooks/useOrder.js frontend/src/hooks/useOrders.js frontend/src/hooks/usePharmacyOrders.js frontend/src/hooks/usePharmacyStore.js frontend/src/hooks/useStoreDetail.js frontend/src/hooks/useStores.js 2>/dev/null || true
git commit -m "feat(hooks): add core data fetching hooks" || true

# 36. feat(ui): public and authentication layouts
git add frontend/src/layouts/PublicLayout.jsx frontend/src/components/ui/PublicNav* 2>/dev/null || true
git commit -m "feat(ui): public and authentication layouts" || true

# 37. feat(ui): consumer portal layouts and navigation
git add frontend/src/layouts/ConsumerLayout.jsx frontend/src/components/consumer/ConsumerNav* 2>/dev/null || true
git commit -m "feat(ui): consumer portal layouts and navigation" || true

# 38. feat(ui): admin and pharmacy dashboard layouts
git add frontend/src/layouts/AdminLayout* frontend/src/layouts/PharmacyLayout* frontend/src/components/ui/PageHeader* 2>/dev/null || true
git commit -m "feat(ui): admin and pharmacy dashboard layouts" || true

# 39. feat(ui): extract reusable pagination component
git add frontend/src/components/ui/Pagination.jsx 2>/dev/null || true
git commit -m "feat(ui): extract reusable pagination component" || true

# 40. feat(public): landing page and static content
git add frontend/src/pages/public/Landing* frontend/src/pages/public/About.jsx frontend/src/pages/public/HowItWorks.jsx frontend/src/pages/NotFound.jsx 2>/dev/null || true
git commit -m "feat(public): landing page and static content" || true

# 41. feat(public): user and pharmacy authentication pages
git add frontend/src/pages/public/Login* frontend/src/pages/public/ConsumerSignup* frontend/src/pages/public/ForPharmacies.jsx 2>/dev/null || true
git commit -m "feat(public): user and pharmacy authentication pages" || true

# 42. feat(consumer): home page and local store discovery
git add frontend/src/pages/consumer/ConsumerHome* frontend/src/pages/consumer/ConsumerStores* frontend/src/pages/consumer/StoreProfile.jsx 2>/dev/null || true
git commit -m "feat(consumer): home page and local store discovery" || true

# 43. feat(consumer): medicine browsing and detail views
git add frontend/src/pages/consumer/MedicineBrowse* frontend/src/pages/consumer/MedicineDetail* 2>/dev/null || true
git commit -m "feat(consumer): medicine browsing and detail views" || true

# 44. feat(consumer): shopping cart and checkout flow
git add frontend/src/pages/consumer/Cart* frontend/src/pages/consumer/Checkout* 2>/dev/null || true
git commit -m "feat(consumer): shopping cart and checkout flow" || true

# 45. feat(consumer): order tracking and history
git add frontend/src/pages/consumer/OrderTracking* frontend/src/pages/consumer/MyOrders* 2>/dev/null || true
git commit -m "feat(consumer): order tracking and history" || true

# 46. feat(consumer): user profile and notifications
git add frontend/src/pages/consumer/ConsumerProfile* frontend/src/pages/consumer/ConsumerNotifications.jsx 2>/dev/null || true
git commit -m "feat(consumer): user profile and notifications" || true

# 47. feat(pharmacy): pharmacy registration flow
git add frontend/src/pages/pharmacy/PharmacyRegister* 2>/dev/null || true
git commit -m "feat(pharmacy): pharmacy registration flow" || true

# 48. feat(pharmacy): pharmacy dashboard and analytics hooks
git add frontend/src/pages/pharmacy/PharmacyDashboard* frontend/src/pages/pharmacy/PharmacyAnalytics* frontend/src/hooks/usePharmacyAnalytics.js 2>/dev/null || true
git commit -m "feat(pharmacy): pharmacy dashboard and analytics hooks" || true

# 49. feat(pharmacy): inventory management and expiry alerts
git add frontend/src/pages/pharmacy/PharmacyInventory* frontend/src/pages/pharmacy/PharmacyPricing.jsx frontend/src/pages/pharmacy/ExpiryAlerts.jsx 2>/dev/null || true
git commit -m "feat(pharmacy): inventory management and expiry alerts" || true

# 50. feat(pharmacy): incoming order management
git add frontend/src/pages/pharmacy/PharmacyOrders* frontend/src/pages/pharmacy/PharmacyPending* frontend/src/pages/pharmacy/PharmacySuspended.jsx 2>/dev/null || true
git commit -m "feat(pharmacy): incoming order management" || true

# 51. feat(pharmacy): pharmacy complaints and profile settings
git add frontend/src/pages/pharmacy/PharmacyComplaints* frontend/src/pages/pharmacy/PharmacyStoreProfile.jsx frontend/src/pages/pharmacy/PharmacyNotifications.jsx 2>/dev/null || true
git commit -m "feat(pharmacy): pharmacy complaints and profile settings" || true

# 52. feat(admin): admin dashboard and platform analytics
git add frontend/src/pages/admin/AdminDashboard* frontend/src/pages/admin/AdminAnalytics.jsx 2>/dev/null || true
git commit -m "feat(admin): admin dashboard and platform analytics" || true

# 53. feat(admin): pharmacy application review interface
git add frontend/src/pages/admin/AdminApplicationReview* frontend/src/pages/admin/AdminPharmacies* 2>/dev/null || true
git commit -m "feat(admin): pharmacy application review interface" || true

# 54. feat(admin): master medicine catalogue interface
git add frontend/src/pages/admin/AdminMedicines* 2>/dev/null || true
git commit -m "feat(admin): master medicine catalogue interface" || true

# 55. feat(admin): platform-wide order monitoring
git add frontend/src/pages/admin/AdminOrders* frontend/src/pages/admin/AdminOrdersV2* 2>/dev/null || true
git commit -m "feat(admin): platform-wide order monitoring" || true

# 56. feat(admin): platform user management interface
git add frontend/src/pages/admin/AdminUsers.jsx 2>/dev/null || true
git commit -m "feat(admin): platform user management interface" || true

# 57. feat(admin): centralized complaint management interface
git add frontend/src/pages/admin/AdminComplaints* 2>/dev/null || true
git commit -m "feat(admin): centralized complaint management interface" || true

# 58. feat(admin): platform settings and configuration interface
git add frontend/src/pages/admin/AdminSettings* frontend/src/pages/admin/AdminNotifications.jsx 2>/dev/null || true
git commit -m "feat(admin): platform settings and configuration interface" || true

# 59. chore: add frontend static assets
git add frontend/public/ frontend/src/assets/ 2>/dev/null || true
git commit -m "chore: add frontend static assets" || true

# 60. Final catch-all for any files that were accidentally missed
git add .
git commit -m "chore: ensure all files are included" || true

# Cleanup empty commits
echo "Done! The new history is in the branch new_history."

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/get-square-footage(.*)",
  "/api/calculate-distance(.*)",
  "/api/send-email(.*)",
  "/api/send-email-simple(.*)",
  "/api/send-step3-notification(.*)",
  "/api/send-outside-area-inquiry(.*)",
  "/api/test-email-delivery(.*)",
  "/api/test-customer-email(.*)",
  "/api/twilio-sms(.*)",
  "/api/cron/(.*)",
  "/api/sendgrid(.*)",
])

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect()
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}

// Entry point (design/review-plan-2026-11-17.md, step 12). Each screen lives in its own file under
// js/screens/; this file only starts them. Pure logic lives in js/logic/.
import { initHome, refreshHome, getChosenKind, afterWorkClosed } from "./screens/home.js";
import { initWork } from "./screens/work.js";
import { initIntake } from "./screens/intake.js";
import { initProfile } from "./screens/profile.js";
import { initLooking } from "./screens/looking.js";
import { initCalendar } from "./screens/calendar.js";
import { initMe } from "./screens/me.js";
import { initChat } from "./screens/chat.js";

initWork({ onClose: afterWorkClosed, getChosenKind });
initIntake();
initProfile();
initLooking();
initHome();
initCalendar();
initChat({ getChosenKind });
refreshHome();
initMe();

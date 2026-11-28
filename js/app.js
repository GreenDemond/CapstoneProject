// Entry point (design/review-plan-2026-11-17.md, step 12). Each screen lives in its own file under
// js/screens/; this file only starts them. Pure logic lives in js/logic/.
import { initHome, refreshHome, getChosenKind, getClassLabel, afterWorkClosed, openStepsFromChat } from "./screens/home.js";
import { initWork } from "./screens/work.js";
import { initIntake } from "./screens/intake.js";
import { initProfile } from "./screens/profile.js";
import { initLooking } from "./screens/looking.js";
import { initCalendar } from "./screens/calendar.js";
import { initMe } from "./screens/me.js";
import { initChat } from "./screens/chat.js";
import { initLookup } from "./screens/lookup.js";
import { initTabs } from "./screens/tabs.js";

initWork({ onClose: afterWorkClosed, getChosenKind, getClassLabel });
initIntake();
initProfile();
initLooking({ onDataChanged: refreshHome });
initHome();
initCalendar({ onThoughtsChanged: refreshHome });
initChat({ getChosenKind, useSteps: openStepsFromChat });
refreshHome();
initMe();
initLookup();
initTabs();

import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';

// z and _ are supplied by Tavern Helper. Merge CodexShape into an existing host
// schema instead of registering a second, competing schema on the same card.
const marks = () => z.record(z.string(),z.boolean()).prefault({});
const ticket = z.object({
  id:z.string().nullable().prefault(null),triggerTurn:z.string().prefault(''),
  name:z.string().prefault(''),category:z.string().prefault(''),
  drawTurn:z.string().prefault(''),status:z.string().prefault('pending'),
  crossed:z.object({karma:z.array(z.string()).prefault([]),correction:z.array(z.string()).prefault([])}).prefault({})
}).passthrough();
export const CodexShape = {
  _causal_codex:z.object({
    _death_seen:z.record(z.string(),z.object({turn:z.string().prefault(''),status:z.string().prefault('pending')})).prefault({}),
    _death_marks_karma:marks(),_death_marks_correction:marks(),
    _pending_death_trigger:ticket.nullable().prefault(null),_last_death:ticket.nullable().prefault(null),
    _revive_count:z.coerce.number().transform(value=>Math.max(0,Math.trunc(Number(value)||0))).prefault(0),
    _revive_pending:z.object({turn:z.string(),count:z.number()}).nullable().prefault(null),
    _last_death_draw_turn:z.string().prefault(''),_mechanical_notice:z.string().prefault('')
  }).prefault({})
};
export const Schema=z.object(CodexShape).passthrough();
$(()=>{registerMvuSchema(Schema);});

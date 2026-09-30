import { useState } from 'react';
import styled from 'styled-components';
import modalArt from '../../assets/letterWhole.svg';
import letterMobile from '../../assets/letterMobile.svg';
import btnWLabel from '../../assets/btnWLabel.svg';
import IconButton from '../IconButton/IconButton';
import { CloseIcon } from '../IconButton/icons';

const MAX_LENGTH = 100;

const PRESET_PHRASES = [
  '당신의 삶과 용기를 오래도록 기억하겠습니다.',
  '우리의 기억 속에서 당신의 이야기를 이어가겠습니다.',
  '세상에 목소리를 내어주신 용기에 깊이 감사드립니다.',
  '지나온 역사를 마음에 새기며 더 나은 내일을 만들어가겠습니다.'
];

// The card region inside modal.svg's own 1316x787 canvas (the "details" frame
// from the Figma file), expressed as percentages of the artwork's box. ArtBg
// is rendered at 120% and centered (see below), so these are the original
// Figma percentages rescaled by that same 1.2x + centering offset to stay
// aligned with the artwork.
const ART_SCALE = 1.2;
const ART_OFFSET_PERCENT = ((1 - ART_SCALE) / 2) * 100 + 7;
const CARD_LEFT_PERCENT = ART_OFFSET_PERCENT + 7.45 * ART_SCALE;
const CARD_TOP_PERCENT = ART_OFFSET_PERCENT + 6.96 * ART_SCALE;
const CARD_WIDTH_PERCENT = 75.99 * ART_SCALE;
const CARD_HEIGHT_PERCENT = 82.34 * ART_SCALE;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: color-mix(in srgb, var(--neutral-black) 60%, transparent);
  opacity: ${(props) => (props.$open ? 1 : 0)};
  pointer-events: ${(props) => (props.$open ? 'auto' : 'none')};
  transition: opacity 0.35s ease;
`;

const Sheet = styled.div`
  position: relative;
  width: min(94vw, 980px);
  aspect-ratio: 1316 / 787;
  transform: translateY(${(props) => (props.$open ? '0' : '48px')});
  opacity: ${(props) => (props.$open ? 1 : 0)};
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease;

  @media (max-width: 640px) {
    display: none;
  }
`;

// Below the breakpoint, the fixed-canvas-percentage approach above gives way
// to a simpler content-sized card: letterMobile.svg has no fixed "safe zone"
// math behind it, it's just stretched (object-fit: fill) to whatever box the
// actual content (tabs/lines/button, or just the message) ends up needing.
const MobileFrame = styled.div`
  display: none;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  width: min(96vw, 440px);

  @media (max-width: 640px) {
    display: flex;
  }
`;

const MobileSheet = styled.div`
  position: relative;
  width: 100%;
  transform: translateY(${(props) => (props.$open ? '0' : '48px')});
  opacity: ${(props) => (props.$open ? 1 : 0)};
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease;
`;

// Write mode's content is a FIXED total height (tabs + a 5-line box + footer
// + button, always — typing more/less text never changes it, and the
// "직접 입력"/"문구 선택" tabs reserve identical space too), so a fixed-size,
// fixed-position art image can be tuned once to frame it and never needs to
// react to content changes.
const MobileArtBg = styled.img`
  position: absolute;
  /* Fixed (not %) on purpose: a percentage here is relative to MobileSheet's
     own height. Since write mode's content height is constant anyway, this
     never needs to move — but a %-based value would still be wrong the
     moment anything nearby changed, because it recalculates against
     whatever the new total happens to be. */
  top: 17rem;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 0;
  width: 180%;
  height: auto;
  object-fit: fill;
  display: block;
  pointer-events: none;

`;

// View mode is the opposite: a one-line message and a five-line message
// need genuinely different card heights, so the art has to actually stretch
// to match instead of staying a fixed size — otherwise a short message
// leaves a fixed ~700px-tall image looming way past the actual text (which
// is exactly the "giant empty card" bug). Filling the content-sized
// MobileSheet box works here because view mode has no tabs/dip to keep
// aligned — the whole shape can just stretch uniformly.
const MobileArtBgView = styled.img`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 0;
  width: 120%;
  height: auto;
  object-fit: fill;
  display: block;
  pointer-events: none;
`;

const MobileCloseBtn = styled(IconButton)`
  background-color: rgba(235, 248, 252, 0.3);
  position: absolute;
  left: 45%;
  top: 12rem;
 
`;

const MobileDetailPanel = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.1rem;
  /* letterMobile.svg's own dashed outline has a surprising amount of dead
     transparent space below its bottom scallops (measured empirically —
     roughly 75px worth once stretched to this card's height), so the
     bottom padding needs to clear that dead space *plus* a visible buffer,
     not just "some padding". */
  padding: 3.25rem 2.5rem 6.5rem;
`;

const ArtBg = styled.img`
  position: absolute;
  left: 50%;
  top: 64%;
  transform: translate(-50%, -50%);
  width: 116%;
  display: block;
  pointer-events: none;
`;

const CloseBtn = styled(IconButton)`
  position: absolute;
  left: 50%;
  top: -3rem;
  transform: translateX(-50%);
  z-index: 2;
  background-color: rgba(235, 248, 252, 0.30);
`;

const DetailPanel = styled.div`
  position: absolute;
  left: ${CARD_LEFT_PERCENT}%;
  top: ${CARD_TOP_PERCENT}%;
  width: ${CARD_WIDTH_PERCENT}%;
  height: ${CARD_HEIGHT_PERCENT}%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(14px, 3vw, 28px);
  padding: clamp(16px, 4vw, 40px) clamp(20px, 6vw, 64px);
`;

const Tabs = styled.div`
  display: inline-flex;
  padding: 0.5rem;
  gap: 0.5rem;
  border-radius: 2.125rem;
  background: var(--surface-dim);
  margin-left: -2rem;
  margin-top: 2rem;
`;

const MobileTabs = styled(Tabs)`
  margin-top: 2em;
  /* margin: 0; */
  padding: 0.375rem;
  gap: 0.375rem;
`;

const TabBtn = styled.button`
  padding: 8px 20px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  background: ${(props) => (props.$active ? 'var(--button-tertiary)' : 'transparent')};
  color: ${(props) =>
    props.$active
      ? 'var(--text-primary)'
      : 'color-mix(in srgb, var(--text-tertiary) 100%, transparent)'};
  transition: background 0.2s ease, color 0.2s ease;
`;

const TextArea = styled.textarea`
  width: 60%;
  margin-top: 2rem;
  margin-left: -2rem;
  flex: 1;
  min-height: 0;
  font-family: 'SheLeeOkSun';
  resize: none;
  border: none;
  outline: none;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent calc(2.1em - 1px),
    color-mix(in srgb, var(--neutral-10), transparent) calc(2.1em - 1px),
    color-mix(in srgb, var(--neutral-10), transparent) 2.1em
  );
  line-height: 2.1em;
  font-size: 1.5rem;
  color: var(--text-primary);
  /* font-family: inherit; */

  &::placeholder {
    color: color-mix(in srgb, var(--neutral-10) 30%, transparent);
  }
`;

const MobileTextArea = styled.textarea`
  width: 120%;
  margin: 0;
  margin-top: 1rem;
  flex: none;
  height: calc(5 * 2.1em);
  font-family: 'SheLeeOkSun';
  resize: none;
  border: none;
  outline: none;
  overflow: hidden;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent calc(2.1em - 1px),
    color-mix(in srgb, var(--neutral-10), transparent) calc(2.1em - 1px),
    color-mix(in srgb, var(--neutral-10), transparent) 2.1em
  );
  line-height: 2.1em;
  font-size: 1.1rem;
  color: var(--text-primary);

  &::placeholder {
    color: color-mix(in srgb, var(--neutral-10) 30%, transparent);
  }
`;

// Read-only message display for mobile view mode — sized to fit whatever
// the message actually needs (unlike the write-mode textarea's fixed
// 4-line box), since the mobile card itself is content-sized.
const MobileViewText = styled.p`
  margin: 0;
  width: 100%;
  font-family: 'SheLeeOkSun';
  font-size: 1.1rem;
  line-height: 2.1em;
   height: calc(4 * 2.1em);
  color: var(--text-primary);
  text-align: left;
  white-space: pre-wrap;
  word-break: keep-all;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent calc(2.1em - 1px),
    color-mix(in srgb, var(--neutral-10), transparent) calc(2.1em - 1px),
    color-mix(in srgb, var(--neutral-10), transparent) 2.1em
  );
`;

const SelectWrap = styled.div`
  position: relative;
  width: 60%;
  flex: 1;
  min-height: 0;
  margin-top: 2rem;
  margin-left: -2rem;
`;

const MobileSelectWrap = styled(SelectWrap)`
  width: 120%;
  margin: 0;
  margin-top: 1rem;
  flex: none;
  /* Same font-size as MobileTextArea so the "em" below resolves to the same
     pixel value — otherwise it inherits the ambient (smaller) font-size and
     the box ends up shorter than the textarea it's supposed to match. */
  font-size: 1.1rem;
  /* Same fixed height as MobileTextArea (5 lines) — SelectRow itself is only
     one row tall, but reserving the same box means switching between "직접
     입력" and "문구 선택" doesn't resize the card (which would also reflow
     the fixed-position MobileArtBg behind it). */
  height: calc(5 * 2.1em);
`;

const SelectRow = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 0 4px 10px;
  border: none;
  border-bottom: 1px solid color-mix(in srgb, var(--neutral-10) 18%, transparent);
  background: transparent;
  cursor: pointer;
  font-size: 1.5rem;
  font-family: 'SheLeeOkSun';
  text-align: left;
  color: ${(props) => (props.$hasValue ? 'var(--text-primary)' : 'color-mix(in srgb, var(--neutral-10) 30%, transparent)')};
`;

const MobileSelectRow = styled(SelectRow)`
  font-size: 1.1rem;
`;

const ChevronDown = styled.svg`
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  transform: rotate(${(props) => (props.$open ? '180deg' : '0deg')});
  transition: transform 0.15s ease;
`;

const Dropdown = styled.div`
  position: absolute;
  top: 3rem;
  left: 0;
  right: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  padding: 6px;
  border-radius: 12px;
  background: var(--neutral-white);
  box-shadow: 0 10px 28px color-mix(in srgb, var(--neutral-black) 25%, transparent);
`;

const DropdownItem = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font-size: clamp(12px, 1.4vw, 14px);
  color: var(--text-primary);
  font-family: inherit;

  &:hover {
    background: color-mix(in srgb, var(--neutral-10) 6%, transparent);
    border-radius: 8px;
  }
`;

const RadioDot = styled.span`
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid
    ${(props) => (props.$selected ? 'var(--neutral-10)' : 'color-mix(in srgb, var(--neutral-10) 35%, transparent)')};

  &::after {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${(props) => (props.$selected ? 'var(--neutral-10)' : 'transparent')};
  }
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 60%;
  margin-left: -2rem;
  position: relative;
  top: -3rem;
  visibility: ${(props) => (props.$visible ? 'visible' : 'hidden')};
`;

const MobileFooter = styled(Footer)`
  width: 120%;
  margin: 0;
  top: 0;
`;

const CharCount = styled.span`
  font-size: 12px;
  color: color-mix(in srgb, var(--neutral-10) 45%, transparent);
`;

const SendBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  margin-bottom: 2rem;
  margin-top: -2rem;
  margin-left: -2rem;
  cursor: pointer;

  img {
    width: 10rem;
    height: auto;
    display: block;
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const MobileSendBtn = styled(SendBtn)`
  margin: 0;
  margin-top: 0rem;

  img {
    width: 8rem;
  }
`;

function LetterModal({ open, onClose, onSubmit, viewMessage }) {
  const [mode, setMode] = useState('custom');
  const [text, setText] = useState('');
  const [presetOpen, setPresetOpen] = useState(false);
  const isViewOnly = viewMessage != null;

  const handlePick = (phrase) => {
    setText(phrase);
    setPresetOpen(false);
  };

  const handleSubmit = async () => {
    const message = text.trim();
    if (!message) return;
    // onSubmit resolves false when the message got blocked by moderation —
    // keep the modal open with the text intact so the user can edit it,
    // instead of clearing/closing as if it had gone through.
    const accepted = await onSubmit(message);
    if (accepted === false) return;
    setText('');
    setMode('custom');
    setPresetOpen(false);
  };

  return (
    <Backdrop $open={open} onMouseDown={onClose}>
      <Sheet $open={open} onMouseDown={(event) => event.stopPropagation()}>
        <ArtBg src={modalArt} alt="" draggable="false" />

        <CloseBtn
          onClick={onClose}
          ariaLabel="닫기"
          size="32px"
          background="color-mix(in srgb, var(--neutral-10) 85%, transparent)"
          color="var(--neutral-white)"
        >
          <CloseIcon width="12" height="12" />
        </CloseBtn>

        <DetailPanel>
          {isViewOnly ? (
            <>
              {/* Invisible placeholders reserve the exact same vertical space
                  the tabs/send button take up in write mode, so the lined
                  textarea lands in the identical position — just without the
                  actual buttons rendered. */}
              <Tabs style={{ visibility: 'hidden' }} aria-hidden="true">
                <TabBtn type="button" $active>
                  직접 입력
                </TabBtn>
                <TabBtn type="button">문구 선택</TabBtn>
              </Tabs>

              <TextArea value={viewMessage} readOnly />

              <Footer $visible={false} aria-hidden="true">
                <CharCount>
                  {(viewMessage || '').length}/{MAX_LENGTH}
                </CharCount>
              </Footer>

              <SendBtn type="button" style={{ visibility: 'hidden' }} disabled aria-hidden="true">
                <img src={btnWLabel} alt="" draggable="false" />
              </SendBtn>
            </>
          ) : (
            <>
              <Tabs>
                <TabBtn type="button" $active={mode === 'custom'} onClick={() => setMode('custom')}>
                  직접 입력
                </TabBtn>
                <TabBtn type="button" $active={mode === 'preset'} onClick={() => setMode('preset')}>
                  문구 선택
                </TabBtn>
              </Tabs>

              {mode === 'custom' ? (
                <TextArea
                  value={text}
                  maxLength={MAX_LENGTH}
                  placeholder={"소녀에게 전하고 싶은 마음을 적어주세요.\n해당 폰트는 일본군 '위안부' 피해자이신 이옥선 할머니의 손글씨로 제작된 폰트입니다."}
                  onChange={(event) => setText(event.target.value)}
                />
              ) : (
                <SelectWrap>
                  <SelectRow
                    type="button"
                    $hasValue={Boolean(text)}
                    onClick={() => setPresetOpen((value) => !value)}
                  >
                    {text || '문구를 선택해주세요'}
                    <ChevronDown $open={presetOpen} viewBox="0 0 14 14" fill="none">
                      <path
                        d="M2 5L7 10L12 5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </ChevronDown>
                  </SelectRow>

                  {presetOpen && (
                    <Dropdown>
                      {PRESET_PHRASES.map((phrase) => (
                        <DropdownItem key={phrase} type="button" onClick={() => handlePick(phrase)}>
                          <RadioDot $selected={text === phrase} />
                          {phrase}
                        </DropdownItem>
                      ))}
                    </Dropdown>
                  )}
                </SelectWrap>
              )}

              <Footer $visible={mode === 'custom'}>
                <CharCount>
                  {text.length}/{MAX_LENGTH}
                </CharCount>
              </Footer>

              <SendBtn type="button" onClick={handleSubmit} disabled={!text.trim()}>
                <img src={btnWLabel} alt="편지 전하기" draggable="false" />
              </SendBtn>
            </>
          )}
        </DetailPanel>
      </Sheet>

      <MobileFrame onMouseDown={(event) => event.stopPropagation()}>
        {isViewOnly && (
          <MobileCloseBtn
            onClick={onClose}
            ariaLabel="닫기"
            size="2.25rem"
            background="color-mix(in srgb, var(--neutral-10) 85%, transparent)"
            color="var(--neutral-white)"
          >
            <CloseIcon width="12" height="12" />
          </MobileCloseBtn>
        )}

        <MobileSheet $open={open}>
          {isViewOnly ? (
            <MobileArtBgView src={letterMobile} alt="" draggable="false" />
          ) : (
            <MobileArtBg src={letterMobile} alt="" draggable="false" />
          )}

          <MobileDetailPanel>
            {isViewOnly ? (
              <MobileViewText>{viewMessage}</MobileViewText>
            ) : (
              <>
                <MobileTabs>
                  <TabBtn type="button" $active={mode === 'custom'} onClick={() => setMode('custom')}>
                    직접 입력
                  </TabBtn>
                  <TabBtn type="button" $active={mode === 'preset'} onClick={() => setMode('preset')}>
                    문구 선택
                  </TabBtn>
                </MobileTabs>

                {mode === 'custom' ? (
                  <MobileTextArea
                    value={text}
                    maxLength={MAX_LENGTH}
                    placeholder={"소녀에게 전하고 싶은 마음을 적어주세요.\n해당 폰트는 일본군 '위안부' 피해자이신 이옥선 할머니의 손글씨로 제작된 폰트입니다."}
                    onChange={(event) => setText(event.target.value)}
                  />
                ) : (
                  <MobileSelectWrap>
                    <MobileSelectRow
                      type="button"
                      $hasValue={Boolean(text)}
                      onClick={() => setPresetOpen((value) => !value)}
                    >
                      {text || '문구를 선택해주세요'}
                      <ChevronDown $open={presetOpen} viewBox="0 0 14 14" fill="none">
                        <path
                          d="M2 5L7 10L12 5"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </ChevronDown>
                    </MobileSelectRow>

                    {presetOpen && (
                      <Dropdown>
                        {PRESET_PHRASES.map((phrase) => (
                          <DropdownItem key={phrase} type="button" onClick={() => handlePick(phrase)}>
                            <RadioDot $selected={text === phrase} />
                            {phrase}
                          </DropdownItem>
                        ))}
                      </Dropdown>
                    )}
                  </MobileSelectWrap>
                )}

                <MobileFooter $visible={mode === 'custom'}>
                  <CharCount>
                    {text.length}/{MAX_LENGTH}
                  </CharCount>
                </MobileFooter>

                <MobileSendBtn type="button" onClick={handleSubmit} disabled={!text.trim()}>
                  <img src={btnWLabel} alt="편지 전하기" draggable="false" />
                </MobileSendBtn>
              </>
            )}
          </MobileDetailPanel>
        </MobileSheet>
      </MobileFrame>
    </Backdrop>
  );
}

export default LetterModal;

/* @ds-bundle: {"format":4,"namespace":"BoutiqueEmpresarialDesignSystem_fbafa1","components":[{"name":"CheckboxOption","sourcePath":"components/forms/CheckboxOption.jsx"},{"name":"FormStep","sourcePath":"components/forms/FormStep.jsx"},{"name":"ProgressBar","sourcePath":"components/forms/ProgressBar.jsx"},{"name":"RadioGroup","sourcePath":"components/forms/RadioGroup.jsx"},{"name":"ScaleSelect","sourcePath":"components/forms/ScaleSelect.jsx"},{"name":"StepDots","sourcePath":"components/forms/StepDots.jsx"},{"name":"TextField","sourcePath":"components/forms/TextField.jsx"},{"name":"Hint","sourcePath":"components/forms/TextField.jsx"},{"name":"FieldError","sourcePath":"components/forms/TextField.jsx"},{"name":"ApplyLink","sourcePath":"components/site/ApplyLink.jsx"},{"name":"Button","sourcePath":"components/site/Button.jsx"},{"name":"Container","sourcePath":"components/site/Container.jsx"},{"name":"Eyebrow","sourcePath":"components/site/Eyebrow.jsx"},{"name":"FaqAccordion","sourcePath":"components/site/FaqAccordion.jsx"},{"name":"FindingCard","sourcePath":"components/site/FindingCard.jsx"},{"name":"GoldRule","sourcePath":"components/site/GoldRule.jsx"},{"name":"PainList","sourcePath":"components/site/PainList.jsx"},{"name":"Section","sourcePath":"components/site/Section.jsx"},{"name":"SiteFooter","sourcePath":"components/site/SiteFooter.jsx"},{"name":"StepList","sourcePath":"components/site/StepList.jsx"},{"name":"StickyCta","sourcePath":"components/site/StickyCta.jsx"},{"name":"TldrBlock","sourcePath":"components/site/TldrBlock.jsx"},{"name":"Wordmark","sourcePath":"components/site/Wordmark.jsx"},{"name":"AuthorHeader","sourcePath":"components/social/AuthorHeader.jsx"},{"name":"Checklist","sourcePath":"components/social/Checklist.jsx"},{"name":"ContentCard","sourcePath":"components/social/ContentCard.jsx"},{"name":"StepTitle","sourcePath":"components/social/ContentCard.jsx"},{"name":"EditorialDivider","sourcePath":"components/social/EditorialDivider.jsx"},{"name":"ModeTag","sourcePath":"components/social/ModeTag.jsx"},{"name":"NotesBar","sourcePath":"components/social/NotesBar.jsx"},{"name":"SelectionHighlight","sourcePath":"components/social/SelectionHighlight.jsx"}],"sourceHashes":{"components/forms/CheckboxOption.jsx":"78ec8ce5f58c","components/forms/FormStep.jsx":"6d4afe5c54b2","components/forms/ProgressBar.jsx":"099a33434f72","components/forms/RadioGroup.jsx":"f45100871132","components/forms/ScaleSelect.jsx":"7b7e2b2ad612","components/forms/StepDots.jsx":"9028c8dbe8b3","components/forms/TextField.jsx":"88576cf46783","components/site/ApplyLink.jsx":"352c10010f46","components/site/Button.jsx":"52037a84d89f","components/site/Container.jsx":"390d4fc6bc4a","components/site/Eyebrow.jsx":"1e0cf77355d2","components/site/FaqAccordion.jsx":"b0b6522a4d22","components/site/FindingCard.jsx":"69be21c01740","components/site/GoldRule.jsx":"01ce1d791bd3","components/site/PainList.jsx":"397f1f322b0a","components/site/Section.jsx":"08f01d7e3a0d","components/site/SiteFooter.jsx":"9a73142eedd4","components/site/StepList.jsx":"09298b9cf23a","components/site/StickyCta.jsx":"6c924a4bae6e","components/site/TldrBlock.jsx":"f7ccf16c4bd5","components/site/Wordmark.jsx":"3f09ca3c0c70","components/social/AuthorHeader.jsx":"edecd94744e3","components/social/Checklist.jsx":"cd7f4c928738","components/social/ContentCard.jsx":"1a27f9f6f4b9","components/social/EditorialDivider.jsx":"886a2b1cf9d1","components/social/ModeTag.jsx":"8f55f6ab5e37","components/social/NotesBar.jsx":"f8ce2b090b9b","components/social/SelectionHighlight.jsx":"8bccc2ba9ccb","ui_kits/site/FormScreen.jsx":"7cb7c0674499","ui_kits/site/HomeScreen.jsx":"ed264210eb79","ui_kits/site/ProgramScreen.jsx":"60fbcb39727d","ui_kits/social/CardSlides.jsx":"b895d12d2f21"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.BoutiqueEmpresarialDesignSystem_fbafa1 = window.BoutiqueEmpresarialDesignSystem_fbafa1 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/forms/CheckboxOption.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Same anatomy as the radio with 3px corners — square means "more than one",
 *  which is why the single consent box is also square. */
function CheckboxOption({
  checked = false,
  onChange,
  children,
  error,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: style
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      cursor: 'pointer',
      fontFamily: 'var(--font-serif)',
      fontSize: '1.1rem',
      padding: '.5rem 0',
      userSelect: 'none',
      color: 'var(--be-ink)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      width: '1.2em',
      height: '1.2em',
      border: `1px solid ${checked ? 'var(--be-ink)' : '#aaa'}`,
      borderRadius: 'var(--radius-check)',
      marginRight: '.8rem',
      marginTop: '.25em',
      display: 'grid',
      placeContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: '.65em',
      height: '.65em',
      borderRadius: 'var(--radius-check)',
      background: 'var(--be-ink)',
      transform: checked ? 'scale(1)' : 'scale(0)',
      transition: 'transform var(--duration-fast)'
    }
  })), /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    checked: checked,
    onChange: e => onChange && onChange(e.target.checked),
    style: {
      position: 'absolute',
      opacity: 0,
      pointerEvents: 'none'
    }
  }, rest)), /*#__PURE__*/React.createElement("span", null, children)), error && /*#__PURE__*/React.createElement("p", {
    role: "alert",
    style: {
      fontFamily: 'var(--font-serif)',
      color: 'var(--be-error)',
      fontSize: '.85rem',
      marginTop: '.5rem'
    }
  }, error));
}
Object.assign(__ds_scope, { CheckboxOption });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/CheckboxOption.jsx", error: String((e && e.message) || e) }); }

// components/forms/FormStep.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** One question per screen. Slides in from the right over 400ms; shakes on
 *  invalid submit. Nothing else moves. */
function FormStep({
  children,
  active = true,
  shake = false,
  style,
  ...rest
}) {
  if (!active) return null;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      animation: shake ? 'be-shake var(--duration-shake) var(--ease-shake) both' : 'be-step-in var(--duration-step) var(--ease-out) forwards',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { FormStep });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/FormStep.jsx", error: String((e && e.message) || e) }); }

// components/forms/ProgressBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** 2px ink bar on a grey track. The only progress indicator in the system. */
function ProgressBar({
  value = 0,
  style,
  ...rest
}) {
  const pct = Math.max(0, Math.min(100, value));
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "progressbar",
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    "aria-valuenow": Math.round(pct),
    style: {
      width: '100%',
      background: 'var(--be-progress-track)',
      height: 2,
      borderRadius: 2,
      overflow: 'hidden',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--be-ink)',
      height: '100%',
      width: `${pct}%`,
      transition: 'width var(--duration-step) ease'
    }
  }));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/forms/RadioGroup.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Custom radio: 1.2em ring, ink dot that scales in over 200ms.
 *  Long labels align to the top of the ring. */
function RadioGroup({
  name,
  legend,
  options = [],
  value,
  onChange,
  error,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("fieldset", _extends({
    style: {
      border: 0,
      padding: 0,
      margin: 0,
      minWidth: 0,
      ...style
    }
  }, rest), legend && /*#__PURE__*/React.createElement("legend", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontSize: '1.5rem',
      fontWeight: 'var(--weight-semibold)',
      lineHeight: 1.2,
      marginBottom: '1.5rem',
      padding: 0
    }
  }, legend), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '.8rem'
    }
  }, options.map(opt => {
    const label = typeof opt === 'string' ? opt : opt.label;
    const val = typeof opt === 'string' ? opt : opt.value;
    const checked = value === val;
    const long = label.length > 34;
    return /*#__PURE__*/React.createElement("label", {
      key: val,
      style: {
        display: 'flex',
        alignItems: long ? 'flex-start' : 'center',
        cursor: 'pointer',
        fontFamily: 'var(--font-serif)',
        fontSize: '1.1rem',
        padding: '.5rem 0',
        userSelect: 'none',
        color: 'var(--be-ink)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flexShrink: 0,
        width: '1.2em',
        height: '1.2em',
        border: `1px solid ${checked ? 'var(--be-ink)' : '#aaa'}`,
        borderRadius: '50%',
        marginRight: '.8rem',
        marginTop: long ? '.25em' : 0,
        display: 'grid',
        placeContent: 'center'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: '.65em',
        height: '.65em',
        borderRadius: '50%',
        background: 'var(--be-ink)',
        transform: checked ? 'scale(1)' : 'scale(0)',
        transition: 'transform var(--duration-fast)'
      }
    })), /*#__PURE__*/React.createElement("input", {
      type: "radio",
      name: name,
      value: val,
      checked: checked,
      onChange: () => onChange && onChange(val),
      style: {
        position: 'absolute',
        opacity: 0,
        pointerEvents: 'none'
      }
    }), label);
  })), error && /*#__PURE__*/React.createElement("p", {
    role: "alert",
    style: {
      fontFamily: 'var(--font-serif)',
      color: 'var(--be-error)',
      fontSize: '.85rem',
      marginTop: '.5rem'
    }
  }, error));
}
Object.assign(__ds_scope, { RadioGroup });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/RadioGroup.jsx", error: String((e && e.message) || e) }); }

// components/forms/ScaleSelect.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** 0–10 rating: a horizontal radio group where each score is a 2.75rem chip
 *  (44px tap target) that fills ink when selected. */
function ScaleSelect({
  name = 'scale',
  legend,
  min = 0,
  max = 10,
  value,
  onChange,
  error,
  style,
  ...rest
}) {
  const values = [];
  for (let i = min; i <= max; i += 1) values.push(i);
  return /*#__PURE__*/React.createElement("fieldset", _extends({
    style: {
      border: 0,
      padding: 0,
      margin: 0,
      minWidth: 0,
      ...style
    }
  }, rest), legend && /*#__PURE__*/React.createElement("legend", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontSize: '1.5rem',
      fontWeight: 'var(--weight-semibold)',
      lineHeight: 1.2,
      marginBottom: '1.5rem',
      padding: 0
    }
  }, legend), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '.5rem'
    }
  }, values.map(v => {
    const checked = String(value) === String(v);
    return /*#__PURE__*/React.createElement("label", {
      key: v,
      style: {
        cursor: 'pointer',
        userSelect: 'none'
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "radio",
      name: name,
      value: v,
      checked: checked,
      onChange: () => onChange && onChange(v),
      style: {
        position: 'absolute',
        opacity: 0,
        pointerEvents: 'none'
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'grid',
        placeContent: 'center',
        minWidth: '2.75rem',
        height: '2.75rem',
        border: `1px solid ${checked ? 'var(--be-ink)' : '#aaa'}`,
        borderRadius: 'var(--radius-control)',
        fontFamily: 'var(--font-serif)',
        fontSize: '1.1rem',
        background: checked ? 'var(--be-ink)' : 'transparent',
        color: checked ? '#fff' : 'var(--be-ink)',
        transition: 'background var(--duration-fast), color var(--duration-fast)'
      }
    }, v));
  })), error && /*#__PURE__*/React.createElement("p", {
    role: "alert",
    style: {
      fontFamily: 'var(--font-serif)',
      color: 'var(--be-error)',
      fontSize: '.85rem',
      marginTop: '.5rem'
    }
  }, error));
}
Object.assign(__ds_scope, { ScaleSelect });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/ScaleSelect.jsx", error: String((e && e.message) || e) }); }

// components/forms/StepDots.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** 6px dots under the form, one per step; the active one goes ink. */
function StepDots({
  count = 0,
  active = 0,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    "aria-hidden": "true",
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: '.4rem',
      ...style
    }
  }, rest), Array.from({
    length: count
  }).map((_, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: i === active ? 'var(--be-ink)' : 'var(--be-dot-idle)',
      transition: 'background var(--duration-base)'
    }
  })));
}
Object.assign(__ds_scope, { StepDots });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/StepDots.jsx", error: String((e && e.message) || e) }); }

// components/forms/TextField.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Underline text field. No box, no fill: a hairline that thickens to 2px ink
 *  on focus and turns red on error. 16px minimum so iOS doesn't zoom. */
function TextField({
  label,
  hint,
  error,
  type = 'text',
  value,
  onChange,
  placeholder = 'Digite sua resposta...',
  multiline = false,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const borderColor = error ? 'var(--be-error)' : focus ? 'var(--be-ink)' : 'var(--be-field-line)';
  const fieldStyle = {
    width: '100%',
    background: 'transparent',
    border: 0,
    borderBottom: `${focus && !error ? 2 : 1}px solid ${borderColor}`,
    fontFamily: 'var(--font-serif)',
    fontSize: 16,
    padding: '.8rem 0',
    color: 'var(--be-ink)',
    borderRadius: 0,
    outline: 'none',
    transition: 'border-color var(--duration-base)',
    ...(multiline ? {
      resize: 'vertical',
      minHeight: '5.5rem',
      lineHeight: 1.5
    } : null)
  };
  const Field = multiline ? 'textarea' : 'input';
  return /*#__PURE__*/React.createElement("div", {
    style: style
  }, label && /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block',
      fontFamily: 'var(--font-serif)',
      fontSize: '1.5rem',
      fontWeight: 'var(--weight-semibold)',
      lineHeight: 1.2,
      marginBottom: '1.5rem',
      color: 'var(--be-ink)'
    }
  }, label), hint && /*#__PURE__*/React.createElement(Hint, null, hint), /*#__PURE__*/React.createElement(Field, _extends({
    type: multiline ? undefined : type,
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    "aria-invalid": error ? 'true' : 'false',
    style: fieldStyle
  }, rest)), error && /*#__PURE__*/React.createElement(FieldError, null, error));
}
function Hint({
  children
}) {
  return /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontSize: '.9rem',
      color: 'var(--be-ink-secondary)',
      marginBottom: '1rem',
      lineHeight: 1.5
    }
  }, children);
}
function FieldError({
  children
}) {
  return /*#__PURE__*/React.createElement("p", {
    role: "alert",
    style: {
      fontFamily: 'var(--font-serif)',
      color: 'var(--be-error)',
      fontSize: '.85rem',
      marginTop: '.5rem'
    }
  }, children);
}
Object.assign(__ds_scope, { TextField, Hint, FieldError });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/TextField.jsx", error: String((e && e.message) || e) }); }

// components/site/ApplyLink.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Nav link with a gold hairline underneath that darkens to ink on hover. */
function ApplyLink({
  children,
  href = '/formulario.html',
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("a", _extends({
    href: href,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--size-body-sm)',
      textDecoration: 'none',
      color: 'inherit',
      borderBottom: `1px solid ${hover ? 'var(--be-ink)' : 'var(--be-gold)'}`,
      padding: '12px 2px',
      transition: 'border-color var(--duration-base)',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { ApplyLink });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/site/ApplyLink.jsx", error: String((e && e.message) || e) }); }

// components/site/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const base = {
  display: 'inline-block',
  fontFamily: 'var(--font-sans)',
  textDecoration: 'none',
  textAlign: 'center',
  cursor: 'pointer',
  letterSpacing: '0.02em',
  borderRadius: 'var(--radius-button)',
  border: '1px solid var(--be-ink)',
  transition: 'background-color var(--duration-base), color var(--duration-base)'
};
const sizes = {
  md: {
    padding: '18px 40px',
    fontSize: '1rem'
  },
  sm: {
    padding: '16px 40px',
    fontSize: '0.9rem'
  }
};
function Button({
  children,
  href,
  variant = 'solid',
  size = 'md',
  block = false,
  disabled = false,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const solid = variant === 'solid';
  const filled = solid ? !hover : hover;
  const resolved = {
    ...base,
    ...sizes[size],
    backgroundColor: filled ? 'var(--be-ink)' : 'transparent',
    color: filled ? '#fff' : 'var(--be-ink)',
    width: block ? '100%' : undefined,
    opacity: disabled ? 'var(--disabled-opacity)' : 1,
    pointerEvents: disabled ? 'none' : undefined,
    ...style
  };
  const handlers = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    onFocus: () => setHover(true),
    onBlur: () => setHover(false)
  };
  if (href) {
    return /*#__PURE__*/React.createElement("a", _extends({
      href: href,
      style: resolved,
      onClick: onClick
    }, handlers, rest), children);
  }
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    style: resolved,
    disabled: disabled,
    onClick: onClick
  }, handlers, rest), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/site/Button.jsx", error: String((e && e.message) || e) }); }

// components/site/Container.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Container({
  children,
  width = 'body',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      maxWidth: width === 'wide' ? 'var(--container-wide)' : 'var(--container-body)',
      margin: '0 auto',
      padding: '0 var(--gutter)',
      position: 'relative',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Container });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/site/Container.jsx", error: String((e && e.message) || e) }); }

// components/site/Eyebrow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Uppercase micro-label above a headline. `spaced` uses the 0.2em hero tracking. */
function Eyebrow({
  children,
  spaced = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'block',
      fontFamily: 'var(--font-sans)',
      textTransform: 'uppercase',
      fontSize: spaced ? '0.75rem' : '0.72rem',
      letterSpacing: spaced ? 'var(--tracking-eyebrow)' : 'var(--tracking-label)',
      color: 'var(--be-ink-secondary)',
      marginBottom: 'var(--space-5)',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Eyebrow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/site/Eyebrow.jsx", error: String((e && e.message) || e) }); }

// components/site/FaqAccordion.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Native <details> accordion. No JS in the source — the marker is a gold
 *  "+" that becomes "–" when open, floated right. */
function FaqAccordion({
  items = [],
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: style
  }, rest), items.map((item, i) => /*#__PURE__*/React.createElement(FaqItem, {
    key: i,
    question: item.question,
    answer: item.answer
  })));
}
function FaqItem({
  question,
  answer
}) {
  const [open, setOpen] = React.useState(false);
  return /*#__PURE__*/React.createElement("details", {
    open: open,
    onToggle: e => setOpen(e.currentTarget.open),
    style: {
      borderBottom: '1px solid var(--be-border)',
      padding: 'var(--space-5) 0'
    }
  }, /*#__PURE__*/React.createElement("summary", {
    style: {
      cursor: 'pointer',
      listStyle: 'none',
      fontFamily: 'var(--font-serif)',
      fontWeight: 'var(--weight-regular)',
      fontSize: '1.125rem',
      color: 'var(--be-ink)',
      display: 'flex',
      justifyContent: 'space-between',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement("span", null, question), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      color: 'var(--be-gold-text)'
    }
  }, open ? '–' : '+')), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--weight-body)',
      fontSize: 'var(--size-body)',
      lineHeight: 'var(--leading-body)',
      color: 'var(--be-ink-secondary)',
      marginTop: 12,
      maxWidth: 'var(--measure-prose)'
    }
  }, answer));
}
Object.assign(__ds_scope, { FaqAccordion });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/site/FaqAccordion.jsx", error: String((e && e.message) || e) }); }

// components/site/FindingCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** White card on the cream field: Playfair numeral in gold, square corners,
 *  hairline border. `hoverable` adds the one shadow the brand owns — use it
 *  only when the card is actually clickable. */
function FindingCard({
  number,
  title,
  children,
  hoverable = false,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("article", _extends({
    onMouseEnter: () => hoverable && setHover(true),
    onMouseLeave: () => hoverable && setHover(false),
    style: {
      backgroundColor: 'var(--be-white)',
      padding: 'var(--space-10)',
      border: '1px solid var(--be-border)',
      boxShadow: hover ? 'var(--shadow-card-hover)' : 'none',
      transition: 'box-shadow var(--duration-base) ease',
      ...style
    }
  }, rest), number != null && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontFamily: 'var(--font-serif)',
      fontSize: 'var(--size-numeral)',
      lineHeight: 1.1,
      color: 'var(--be-gold-text)',
      marginBottom: 10
    }
  }, number), title && /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontWeight: 'var(--weight-regular)',
      fontSize: 'var(--size-h3)',
      lineHeight: 'var(--leading-h3)',
      letterSpacing: 'var(--tracking-heading)',
      margin: '0 0 12px'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--weight-body)',
      fontSize: 'var(--size-body)',
      lineHeight: 'var(--leading-body)',
      color: 'var(--be-ink-secondary)'
    }
  }, children));
}
Object.assign(__ds_scope, { FindingCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/site/FindingCard.jsx", error: String((e && e.message) || e) }); }

// components/site/GoldRule.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** The short gold hairline that closes a name or a summary block.
 *  56px under a name, 64px after the TL;DR. Never full-width, never centred. */
function GoldRule({
  length = 56,
  gap = '20px 0 0',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    "aria-hidden": "true",
    style: {
      width: length,
      height: 1,
      background: 'var(--be-gold)',
      margin: gap,
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { GoldRule });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/site/GoldRule.jsx", error: String((e && e.message) || e) }); }

// components/site/PainList.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Qualifier list: each line carries a 2px gold rule on its left edge.
 *  The brand's only list bullet on the marketing pages. */
function PainList({
  items = [],
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("ul", _extends({
    style: {
      listStyle: 'none',
      margin: 'var(--space-10) 0 0',
      padding: 0,
      ...style
    }
  }, rest), items.map((item, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    style: {
      marginBottom: 'var(--space-5)',
      paddingLeft: 'var(--space-5)',
      borderLeft: '2px solid var(--be-gold)',
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--weight-body)',
      fontSize: '1.125rem',
      lineHeight: 'var(--leading-lead)',
      color: 'var(--be-ink-secondary)'
    }
  }, item)));
}
Object.assign(__ds_scope, { PainList });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/site/PainList.jsx", error: String((e && e.message) || e) }); }

// components/site/Section.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const tones = {
  cream: {
    backgroundColor: 'var(--be-cream)',
    color: 'var(--be-ink)'
  },
  white: {
    backgroundColor: 'var(--be-white)',
    color: 'var(--be-ink)'
  },
  inverse: {
    backgroundColor: 'var(--be-ink)',
    color: 'var(--be-cream)'
  }
};
function Section({
  children,
  tone = 'cream',
  rule = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("section", _extends({
    style: {
      padding: 'var(--space-section-fluid) 0',
      borderTop: rule ? '1px solid var(--be-border)' : undefined,
      ...tones[tone],
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Section });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/site/Section.jsx", error: String((e && e.message) || e) }); }

// components/site/SiteFooter.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Centred, quiet footer: trademark line, the brand's two-line promise,
 *  then legal links at 13px. */
function SiteFooter({
  year = 2026,
  promise,
  links = [],
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("footer", _extends({
    style: {
      padding: 'var(--space-14) 0',
      borderTop: '1px solid var(--be-border)',
      textAlign: 'center',
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--weight-body)',
      fontSize: 'var(--size-caption)',
      color: 'var(--be-ink-secondary)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 8px'
    }
  }, "Boutique Empresarial\u2122 \xA9 ", year), promise && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 8px',
      whiteSpace: 'pre-line'
    }
  }, promise), links.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-5)',
      fontSize: 'var(--size-legal)',
      display: 'flex',
      justifyContent: 'center',
      gap: 'var(--space-5)'
    }
  }, links.map((l, i) => /*#__PURE__*/React.createElement("a", {
    key: `${l.label}-${i}`,
    href: l.href,
    style: {
      color: 'var(--be-ink-secondary)',
      textDecoration: 'none',
      padding: '8px 10px'
    }
  }, l.label))));
}
Object.assign(__ds_scope, { SiteFooter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/site/SiteFooter.jsx", error: String((e && e.message) || e) }); }

// components/site/StepList.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Ordered process list. Numerals are Playfair, gold, zero-padded (01, 02, 03);
 *  a hairline connects each step to the next and stops at the penultimate item —
 *  a line after the last step would point at an etapa that doesn't exist. */
function StepList({
  steps = [],
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("ol", _extends({
    style: {
      listStyle: 'none',
      margin: 'var(--space-12) 0 0',
      padding: 0,
      ...style
    }
  }, rest), steps.map((step, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    style: {
      position: 'relative',
      padding: i === steps.length - 1 ? '0 0 0 52px' : '0 0 var(--space-8) 52px',
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--weight-body)',
      fontSize: 'var(--size-body)',
      lineHeight: 'var(--leading-body)',
      color: 'var(--be-ink-secondary)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 0,
      top: -2,
      fontFamily: 'var(--font-serif)',
      fontSize: '1.25rem',
      color: 'var(--be-gold-text)'
    }
  }, String(i + 1).padStart(2, '0')), i !== steps.length - 1 && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 9,
      top: 26,
      bottom: 8,
      width: 1,
      background: 'var(--be-border)'
    }
  }), step)));
}
Object.assign(__ds_scope, { StepList });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/site/StepList.jsx", error: String((e && e.message) || e) }); }

// components/site/StickyCta.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Fixed bottom CTA. Mobile only in production (<768px); the cream background
 *  and hairline top keep it from reading as a floating bar. */
function StickyCta({
  label,
  href = '/formulario.html',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'sticky',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 20,
      padding: '12px 16px',
      background: 'var(--be-cream)',
      borderTop: '1px solid var(--be-border)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    href: href,
    block: true,
    style: {
      padding: '16px 20px'
    }
  }, label));
}
Object.assign(__ds_scope, { StickyCta });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/site/StickyCta.jsx", error: String((e && e.message) || e) }); }

// components/site/TldrBlock.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** "Em síntese" — the answer-engine summary block. Editorial, not an appendix:
 *  same typography and breathing room as any other section, closed by a
 *  64px gold hairline. */
function TldrBlock({
  title = 'Em síntese',
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: style
  }, rest), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontWeight: 'var(--weight-regular)',
      fontSize: 'var(--size-h2)',
      lineHeight: 'var(--leading-h2)',
      letterSpacing: 'var(--tracking-heading)',
      margin: '0 0 var(--space-6)'
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--weight-body)',
      fontSize: 'var(--size-body)',
      lineHeight: 'var(--leading-body)',
      color: 'var(--be-ink-secondary)',
      maxWidth: 'var(--measure-prose)',
      margin: 0
    }
  }, children), /*#__PURE__*/React.createElement(__ds_scope.GoldRule, {
    length: 64,
    gap: "40px 0 8px"
  }));
}
Object.assign(__ds_scope, { TldrBlock });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/site/TldrBlock.jsx", error: String((e && e.message) || e) }); }

// components/site/Wordmark.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** The type wordmark: Playfair semibold, wide-ish tracking, gold full stop.
 *  `asImage` swaps in the real logo file (gold ring + BE monogram). */
function Wordmark({
  href = '/',
  size = '1.35rem',
  asImage = false,
  logoSrc,
  style,
  ...rest
}) {
  if (asImage) {
    return /*#__PURE__*/React.createElement("a", _extends({
      href: href,
      style: {
        display: 'inline-block',
        ...style
      }
    }, rest), /*#__PURE__*/React.createElement("img", {
      src: logoSrc || '../../assets/logo/boutiquelogo.webp',
      alt: "Boutique Empresarial",
      style: {
        width: 200,
        height: 'auto',
        display: 'block'
      }
    }));
  }
  return /*#__PURE__*/React.createElement("a", _extends({
    href: href,
    style: {
      fontFamily: 'var(--font-serif)',
      fontSize: size,
      fontWeight: 'var(--weight-semibold)',
      letterSpacing: 'var(--tracking-wordmark)',
      textDecoration: 'none',
      color: 'inherit',
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), "Boutique Empresarial", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--be-gold)'
    }
  }, "."));
}
Object.assign(__ds_scope, { Wordmark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/site/Wordmark.jsx", error: String((e && e.message) || e) }); }

// components/social/AuthorHeader.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Signature of every content card: circular portrait (or caramel→amber
 *  initials placeholder), name in Playfair bold, cyan verified badge, @handle
 *  in Inter. The badge colour is reserved — cyan appears nowhere else. */
function AuthorHeader({
  name = 'Talita Issei',
  handle = '@issei.talita',
  photoSrc,
  initials = 'TI',
  size = 56,
  verified = true,
  mode = 'light',
  style,
  ...rest
}) {
  const dark = mode === 'dark';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-4)',
      ...style
    }
  }, rest), photoSrc ? /*#__PURE__*/React.createElement("img", {
    src: photoSrc,
    alt: name,
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      objectFit: 'cover',
      flex: '0 0 auto',
      display: 'block'
    }
  }) : /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      flex: '0 0 auto',
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, var(--ti-highlight-caramel), var(--ti-accent-amber))',
      color: '#fff',
      fontFamily: 'var(--font-serif)',
      fontWeight: 'var(--weight-bold)',
      fontSize: size * 0.32,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, initials), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontWeight: 'var(--weight-bold)',
      fontSize: '1.25rem',
      color: dark ? 'var(--ti-dark-primary)' : 'var(--ti-ink-primary)'
    }
  }, name), verified && /*#__PURE__*/React.createElement("img", {
    src: "../../assets/icons/verified-badge.svg",
    alt: "",
    "aria-hidden": "true",
    style: {
      width: 18,
      height: 18,
      flex: '0 0 auto',
      display: 'block'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: '.9rem',
      color: dark ? 'var(--ti-dark-note)' : 'var(--ti-ink-muted)',
      marginTop: 2
    }
  }, handle)));
}
Object.assign(__ds_scope, { AuthorHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/social/AuthorHeader.jsx", error: String((e && e.message) || e) }); }

// components/social/Checklist.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Two checklist styles, one per half of the duality.
 *  A · Diagnóstico — light card, green square check tile, Playfair regular.
 *  B · Método — dark card, literal "[ ]" in amber, Playfair italic. */
function Checklist({
  items = [],
  variant = 'diagnostic',
  style,
  ...rest
}) {
  const method = variant === 'method';
  return /*#__PURE__*/React.createElement("ul", _extends({
    style: {
      listStyle: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)',
      margin: 'var(--space-6) 0 0',
      padding: 0,
      ...style
    }
  }, rest), items.map((item, i) => method ? /*#__PURE__*/React.createElement("li", {
    key: i,
    style: {
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: '1.25rem',
      lineHeight: 1.4,
      color: 'var(--ti-dark-primary)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontStyle: 'normal',
      fontWeight: 'var(--weight-semibold)',
      color: 'var(--ti-accent-amber)',
      marginRight: 6
    }
  }, "[ ]"), item) : /*#__PURE__*/React.createElement("li", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--space-3)',
      fontFamily: 'var(--font-serif)',
      fontSize: '1.25rem',
      lineHeight: 1.4,
      color: 'var(--ti-ink-primary)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: '0 0 auto',
      width: 22,
      height: 22,
      borderRadius: 'var(--radius-check-icon)',
      background: 'var(--ti-check-green)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/icons/check.svg",
    alt: "",
    "aria-hidden": "true",
    style: {
      width: 13,
      height: 13
    }
  })), /*#__PURE__*/React.createElement("span", null, item))));
}
Object.assign(__ds_scope, { Checklist });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/social/Checklist.jsx", error: String((e && e.message) || e) }); }

// components/social/ContentCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** The Instagram card shell — light "Fachada Editorial" or dark "Bastidores".
 *  Hairline border, square corners, 32px/28px padding, optional action row
 *  (heart / comment / send) at the foot. */
function ContentCard({
  mode = 'light',
  children,
  actions = true,
  cta,
  style,
  ...rest
}) {
  const dark = mode === 'dark';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      maxWidth: 'var(--container-card)',
      background: dark ? 'var(--ti-bg-dark-notepad)' : 'var(--ti-bg-paper)',
      color: dark ? 'var(--ti-dark-primary)' : 'var(--ti-ink-primary)',
      border: `1px solid ${dark ? 'var(--ti-dark-border)' : 'var(--ti-border)'}`,
      padding: '32px 28px',
      ...style
    }
  }, rest), children, cta && /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: '1rem',
      color: dark ? 'var(--ti-dark-note)' : 'var(--ti-ink-muted)',
      marginTop: 'var(--space-8)'
    }
  }, cta), actions && /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      display: 'flex',
      gap: 'var(--space-5)',
      marginTop: 36,
      color: dark ? 'var(--ti-dark-primary)' : 'var(--ti-ink-primary)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/icons/heart.svg",
    alt: "",
    style: {
      width: 24,
      height: 24,
      filter: dark ? 'none' : undefined
    }
  }), /*#__PURE__*/React.createElement("img", {
    src: "../../assets/icons/comment.svg",
    alt: "",
    style: {
      width: 24,
      height: 24
    }
  }), /*#__PURE__*/React.createElement("img", {
    src: "../../assets/icons/send.svg",
    alt: "",
    style: {
      width: 24,
      height: 24
    }
  })));
}

/** "Etapa 1 - Manuais simples" — the step title above a method checklist. */
function StepTitle({
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("p", _extends({
    style: {
      fontFamily: 'var(--font-serif)',
      fontSize: '1.5rem',
      color: 'var(--ti-dark-primary)',
      marginBottom: 'var(--space-6)',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { ContentCard, StepTitle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/social/ContentCard.jsx", error: String((e && e.message) || e) }); }

// components/social/EditorialDivider.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Solid, thick (3–4px), short (96–120px), always left-aligned.
 *  Never centred, never full width. */
function EditorialDivider({
  width = 110,
  thickness = 4,
  mode = 'light',
  gap = '40px 0',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    "aria-hidden": "true",
    style: {
      width,
      height: thickness,
      background: mode === 'dark' ? 'var(--ti-dark-primary)' : 'var(--ti-ink-primary)',
      margin: gap,
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { EditorialDivider });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/social/EditorialDivider.jsx", error: String((e && e.message) || e) }); }

// components/social/ModeTag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** "Modo claro / Modo escuro" label used in the internal guide to mark which
 *  half of the duality a block belongs to. Bordered, uppercase, square. */
function ModeTag({
  mode = 'light',
  children,
  style,
  ...rest
}) {
  const dark = mode === 'dark';
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-block',
      fontFamily: 'var(--font-sans)',
      fontSize: '.7rem',
      fontWeight: 'var(--weight-semibold)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-label)',
      padding: '4px 10px',
      border: `1px solid ${dark ? 'var(--ti-accent-amber)' : 'var(--ti-ink-primary)'}`,
      color: dark ? 'var(--ti-accent-amber)' : 'var(--ti-ink-primary)',
      ...style
    }
  }, rest), children || (dark ? 'Modo escuro' : 'Modo claro'));
}
Object.assign(__ds_scope, { ModeTag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/social/ModeTag.jsx", error: String((e && e.message) || e) }); }

// components/social/NotesBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** The Apple Notes chrome that opens every dark "Bastidores" card:
 *  amber chevron + "Notas" on the left, ellipsis on the right.
 *  Never use it on a light card — that mixes the two halves of the duality. */
function NotesBar({
  label = 'Notas',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--weight-semibold)',
      color: 'var(--ti-accent-amber)',
      marginBottom: 'var(--space-12)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: '1.05rem'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/icons/chevron-left.svg",
    alt: "",
    "aria-hidden": "true",
    style: {
      width: 16,
      height: 16
    }
  }), label), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      fontSize: '1.2rem',
      letterSpacing: '.1em'
    }
  }, "\u2022\u2022\u2022"));
}
Object.assign(__ds_scope, { NotesBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/social/NotesBar.jsx", error: String((e && e.message) || e) }); }

// components/social/SelectionHighlight.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** The iOS text-selection highlight: caramel box at 60% opacity with two
 *  pin handles at top-left and bottom-right. Highlight one phrase per card. */
function SelectionHighlight({
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      position: 'relative',
      display: 'inline-block',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: -18,
      left: -5,
      width: 9,
      height: 18,
      background: 'var(--ti-highlight-pin)',
      borderRadius: '50% 50% 3px 3px'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      background: 'var(--ti-highlight-caramel-60)',
      padding: '2px 6px',
      display: 'inline-block'
    }
  }, children), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      bottom: -18,
      right: -5,
      width: 9,
      height: 18,
      background: 'var(--ti-highlight-pin)',
      borderRadius: '3px 3px 50% 50%'
    }
  }));
}
Object.assign(__ds_scope, { SelectionHighlight });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/social/SelectionHighlight.jsx", error: String((e && e.message) || e) }); }

// ui_kits/site/FormScreen.jsx
try { (() => {
const {
  Button,
  Wordmark,
  TextField,
  RadioGroup,
  CheckboxOption,
  ScaleSelect,
  ProgressBar,
  StepDots,
  FormStep
} = window.BoutiqueEmpresarialDesignSystem_fbafa1;
const QUESTIONS = [{
  key: 'nome_completo',
  kind: 'text',
  label: 'Para começar, qual o seu nome completo?'
}, {
  key: 'whatsapp',
  kind: 'text',
  type: 'tel',
  label: 'Qual o seu WhatsApp com DDD?',
  hint: 'Priorizamos o contato por aqui.',
  placeholder: '(DD) 99999-9999'
}, {
  key: 'email',
  kind: 'text',
  type: 'email',
  label: 'E-mail corporativo',
  hint: 'É por ele que enviaremos a confirmação da sua aplicação.',
  placeholder: 'nome@exemplo.com'
}, {
  key: 'modelo_negocio',
  kind: 'radio',
  label: 'Qual é o modelo de negócio da sua empresa?',
  options: ['Serviços (consultoria, agência, prestação de serviço)', 'Produtos físicos (fabricação, varejo, distribuição)', 'E-commerce', 'Infoprodutos / negócio digital', 'Misto (produto + serviço)', 'Outro']
}, {
  key: 'tamanho_equipe',
  kind: 'radio',
  label: 'Quantidade de pessoas no time (CLT + PJ):',
  options: ['Apenas eu', '2 a 4', '5 a 15', 'Mais de 15']
}, {
  key: 'faturamento_mensal',
  kind: 'radio',
  label: 'Faturamento médio mensal nos últimos 3 meses:',
  options: ['Até R$ 30k', 'R$ 30k a R$ 100k', 'R$ 100k a R$ 300k', 'Acima de R$ 300k']
}, {
  key: 'dependencia_operacional',
  kind: 'scale',
  label: 'Em uma escala de 0 a 10, quanto a operação depende de você para funcionar bem e sem erros?'
}, {
  key: 'maior_problema_gestao',
  kind: 'radio',
  label: 'Qual é o maior desafio com a sua equipe hoje?',
  options: ['Refazer trabalho / Falta de qualidade', 'Centralização de decisões em mim', 'Informações perdidas no WhatsApp / Falta de processos']
}, {
  key: 'consentimento',
  kind: 'consent'
}];
function FormIntro() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: '2rem'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.3,
      margin: '0 0 .75rem'
    }
  }, "Sess\xE3o Estrat\xE9gica de Diagn\xF3stico BE"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: '.9rem',
      color: 'var(--be-ink-secondary)',
      lineHeight: 1.5,
      margin: '0 0 1rem'
    }
  }, "Uma reuni\xE3o individual de 45 minutos para identificar em quais etapas a sua opera\xE7\xE3o trava e definir o que precisa ser ajustado para a sua equipe entregar com qualidade \u2014 sem precisar da sua aprova\xE7\xE3o em cada demanda."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontSize: '.9rem',
      color: 'var(--be-ink-secondary)',
      margin: '0 0 1rem'
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: 'var(--be-ink)',
      fontWeight: 600
    }
  }, "O que analisamos na sua sess\xE3o:")), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: '.65rem',
      margin: 0,
      padding: 0
    }
  }, [['Dependência de Aprovação:', 'Mapeamos em quais momentos as tarefas param na sua mesa e quais decisões a sua equipe já deve tomar sozinha.'], ['Erros de Execução e Retrabalho:', 'Localizamos em qual etapa do serviço acontecem as falhas repetidas.'], ['Fluxo de Informação:', 'Avaliamos como estão organizadas as demandas no WhatsApp e nos canais internos.']].map(([b, t]) => /*#__PURE__*/React.createElement("li", {
    key: b,
    style: {
      position: 'relative',
      paddingLeft: '1.1rem',
      fontFamily: 'var(--font-serif)',
      fontSize: '.9rem',
      color: 'var(--be-ink-secondary)',
      lineHeight: 1.5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: '.1rem'
    }
  }, "\u2022"), /*#__PURE__*/React.createElement("strong", {
    style: {
      color: 'var(--be-ink)',
      fontWeight: 600
    }
  }, b), " ", t))));
}
function FormScreen({
  onDone
}) {
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState({});
  const [error, setError] = React.useState(null);
  const [shake, setShake] = React.useState(false);
  const q = QUESTIONS[step];
  const total = QUESTIONS.length;
  const last = step === total - 1;
  const set = v => setAnswers(a => ({
    ...a,
    [q.key]: v
  }));
  function next() {
    const v = answers[q.key];
    const empty = q.kind === 'consent' ? !v : v === undefined || v === '';
    if (empty) {
      setError(q.kind === 'consent' ? 'É necessário aceitar o termo para enviar a aplicação.' : q.kind === 'text' ? 'Preencha este campo para continuar.' : 'Selecione uma opção.');
      setShake(true);
      setTimeout(() => setShake(false), 420);
      return;
    }
    setError(null);
    if (last) onDone();else setStep(step + 1);
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--be-cream)',
      minHeight: '100%',
      display: 'flex',
      justifyContent: 'center',
      padding: '2rem 1rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      maxWidth: 'var(--container-form)',
      padding: '2rem 1.5rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginBottom: '2rem',
      opacity: 0.95
    }
  }, /*#__PURE__*/React.createElement(Wordmark, {
    asImage: true,
    logoSrc: "../../assets/logo/boutiquelogo.webp",
    href: "#"
  })), /*#__PURE__*/React.createElement(ProgressBar, {
    value: (step + 1) / total * 100,
    style: {
      marginBottom: '2rem'
    }
  }), /*#__PURE__*/React.createElement(FormStep, {
    key: step,
    shake: shake
  }, step === 0 && /*#__PURE__*/React.createElement(FormIntro, null), q.kind === 'text' && /*#__PURE__*/React.createElement(TextField, {
    label: q.label,
    hint: q.hint,
    type: q.type,
    error: error,
    placeholder: q.placeholder,
    value: answers[q.key] || '',
    onChange: e => set(e.target.value)
  }), q.kind === 'radio' && /*#__PURE__*/React.createElement(RadioGroup, {
    name: q.key,
    legend: q.label,
    options: q.options,
    value: answers[q.key],
    onChange: set,
    error: error
  }), q.kind === 'scale' && /*#__PURE__*/React.createElement(ScaleSelect, {
    name: q.key,
    legend: q.label,
    value: answers[q.key],
    onChange: set,
    error: error
  }), q.kind === 'consent' && /*#__PURE__*/React.createElement(CheckboxOption, {
    checked: !!answers[q.key],
    onChange: set,
    error: error
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      fontWeight: 600
    }
  }, "Termo de Consentimento."), " Concordo em ser contatado e autorizo o uso dos dados apenas para avalia\xE7\xE3o desta aplica\xE7\xE3o.")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '2.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, step > 0 ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => {
      setError(null);
      setStep(step - 1);
    },
    style: {
      background: 'none',
      border: 0,
      padding: 0,
      fontFamily: 'var(--font-serif)',
      fontSize: '1rem',
      color: 'var(--be-ink-secondary)',
      cursor: 'pointer'
    }
  }, "Voltar") : /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement(Button, {
    onClick: next,
    style: {
      borderRadius: 'var(--radius-control)',
      padding: '.8rem 2rem',
      fontWeight: 600,
      fontFamily: 'var(--font-serif)'
    }
  }, last ? 'Enviar aplicação' : 'Próximo')), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginTop: '2rem'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-serif)',
      color: 'var(--be-ink-secondary)',
      fontSize: '.9rem',
      lineHeight: 1.5,
      marginBottom: '.5rem'
    }
  }, "\u23F3 ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: 'var(--be-ink)',
      fontWeight: 600
    }
  }, "Aplica\xE7\xE3o r\xE1pida (2 minutos)."), " Por ser uma an\xE1lise individual conduzida diretamente por Talita Issei, liberamos apenas", ' ', /*#__PURE__*/React.createElement("strong", {
    style: {
      color: 'var(--be-ink)',
      fontWeight: 600
    }
  }, "3 vagas por semana"), "."), /*#__PURE__*/React.createElement(StepDots, {
    count: total,
    active: step
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '3rem',
      fontSize: '.7rem',
      textAlign: 'center',
      color: 'var(--be-ink-secondary)',
      lineHeight: 1.4,
      borderTop: '1px solid var(--be-progress-track)',
      paddingTop: '1rem',
      fontFamily: 'var(--font-serif)'
    }
  }, "Esta \xE9 uma aplica\xE7\xE3o e n\xE3o garante o agendamento. As vagas s\xE3o limitadas. Ao enviar, voc\xEA concorda com nossa", ' ', /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      color: 'var(--be-ink-secondary)'
    }
  }, "Pol\xEDtica de Privacidade"), ".")));
}
function ThanksScreen({
  onRestart
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--be-cream)',
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 1.5rem',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      maxWidth: 500
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo/boutiquelogo.webp",
    alt: "Boutique Empresarial",
    width: "200",
    height: "200",
    style: {
      width: 200,
      height: 'auto',
      marginBottom: '2rem',
      opacity: 0.9
    }
  }), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontSize: '2rem',
      fontWeight: 600,
      margin: '0 0 1.5rem'
    }
  }, "Solicita\xE7\xE3o Recebida"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 60,
      height: 1,
      background: 'rgba(0,0,0,.1)',
      margin: '2rem auto'
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontSize: '1.2rem',
      lineHeight: 1.6,
      margin: 0
    }
  }, "Suas informa\xE7\xF5es s\xE3o confidenciais. Retornaremos em at\xE9 48h \xFAteis via WhatsApp/E-mail caso sua aplica\xE7\xE3o seja aprovada."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '2.5rem'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    size: "sm",
    onClick: onRestart
  }, "Voltar ao in\xEDcio"))));
}
Object.assign(window, {
  FormScreen,
  ThanksScreen,
  QUESTIONS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/site/FormScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/site/HomeScreen.jsx
try { (() => {
const {
  Container,
  Section,
  Button,
  ApplyLink,
  Wordmark,
  Eyebrow,
  FindingCard,
  PainList,
  StepList,
  GoldRule,
  FaqAccordion,
  TldrBlock,
  SiteFooter,
  StickyCta
} = window.BoutiqueEmpresarialDesignSystem_fbafa1;
const homeHeading = {
  fontFamily: 'var(--font-serif)',
  fontWeight: 400,
  fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
  lineHeight: 1.2,
  letterSpacing: '-0.02em',
  margin: '0 0 24px'
};
const homeBody = {
  fontFamily: 'var(--font-sans)',
  fontWeight: 300,
  fontSize: '1.0625rem',
  lineHeight: 1.8,
  color: 'var(--be-ink-secondary)',
  maxWidth: '66ch',
  margin: '0 0 1.25rem'
};
function SiteHeader({
  onApply
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      padding: '32px 0'
    }
  }, /*#__PURE__*/React.createElement(Container, {
    width: "wide"
  }, /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(Wordmark, {
    href: "#"
  }), /*#__PURE__*/React.createElement(ApplyLink, {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onApply();
    }
  }, "Aplica\xE7\xE3o"))));
}
function HomeScreen({
  onApply
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--be-cream)'
    }
  }, /*#__PURE__*/React.createElement(SiteHeader, {
    onApply: onApply
  }), /*#__PURE__*/React.createElement("main", null, /*#__PURE__*/React.createElement("section", {
    style: {
      padding: 'clamp(40px, 6vh, 72px) 0 clamp(72px, 11vh, 128px)'
    }
  }, /*#__PURE__*/React.createElement(Container, {
    width: "wide"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 700
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 'clamp(2.5rem, 4.4vw, 3.5rem)',
      lineHeight: 1.08,
      letterSpacing: '-0.025em',
      textWrap: 'balance',
      margin: '0 0 28px'
    }
  }, "Descubra exatamente onde sua equipe trava sem voc\xEA, e o que fazer pra resolver"), /*#__PURE__*/React.createElement("p", {
    style: {
      ...homeBody,
      fontSize: '1.25rem',
      lineHeight: 1.7,
      maxWidth: '54ch'
    }
  }, "Uma sess\xE3o individual de 45 minutos para analisar a opera\xE7\xE3o da sua empresa de servi\xE7os e apontar exatamente onde a estrutura precisa de ajuste para o seu time rodar com autonomia."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 36
    }
  }, /*#__PURE__*/React.createElement(Button, {
    onClick: onApply
  }, "Solicitar Diagn\xF3stico Gratuito"))))), /*#__PURE__*/React.createElement(Section, {
    rule: true
  }, /*#__PURE__*/React.createElement(Container, null, /*#__PURE__*/React.createElement("h2", {
    style: homeHeading
  }, "O que analisamos e entregamos na sua sess\xE3o"), /*#__PURE__*/React.createElement("p", {
    style: homeBody
  }, "Durante a reuni\xE3o, avaliamos o momento atual da sua opera\xE7\xE3o e entregamos clareza sobre tr\xEAs pontos centrais:"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 40,
      marginTop: 40
    }
  }, /*#__PURE__*/React.createElement(FindingCard, {
    number: "01",
    title: "O que ainda trava em voc\xEA"
  }, "Mapeamos quais decis\xF5es do dia a dia hoje dependem s\xF3 da sua aprova\xE7\xE3o, e indicamos o que seu time j\xE1 pode decidir sozinho, sem precisar de voc\xEA no meio."), /*#__PURE__*/React.createElement(FindingCard, {
    number: "02",
    title: "Onde a entrega falha"
  }, "Identificamos em que etapa do servi\xE7o sua equipe mais erra ou gera retrabalho, e apontamos o que falta pra isso parar de se repetir."), /*#__PURE__*/React.createElement(FindingCard, {
    number: "03",
    title: "Onde a informa\xE7\xE3o se perde"
  }, "Avaliamos se o WhatsApp e a falta de rotina clara t\xE3o te fazendo perder o controle do que cada um t\xE1 fazendo, e mostramos como organizar isso.")), /*#__PURE__*/React.createElement("p", {
    style: {
      ...homeBody,
      marginTop: 56,
      fontSize: '1.125rem'
    }
  }, "Ao final do encontro, voc\xEA sai sabendo com clareza o que t\xE1 travando sua opera\xE7\xE3o, e o que precisa corrigir primeiro. Se fizer sentido pro seu momento, apresento como podemos fazer essa reestrutura\xE7\xE3o juntas atrav\xE9s da ", /*#__PURE__*/React.createElement("strong", {
    style: {
      fontWeight: 600,
      color: 'var(--be-ink)'
    }
  }, "Boutique Empresarial"), "."))), /*#__PURE__*/React.createElement(Section, {
    tone: "inverse"
  }, /*#__PURE__*/React.createElement(Container, {
    width: "wide"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '5fr 7fr',
      columnGap: 64,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("figure", {
    style: {
      margin: 0
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/fotos/talita-issei.webp",
    width: "800",
    height: "1000",
    alt: "Talita Issei, de blusa branca de um ombro s\xF3, sorrindo, sentada em uma poltrona clara.",
    style: {
      display: 'block',
      width: '100%',
      height: 'auto'
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      ...homeHeading,
      color: 'var(--be-cream)'
    }
  }, "Quem conduz a sua an\xE1lise"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontSize: '2rem',
      lineHeight: 1.2,
      margin: 0,
      color: 'var(--be-cream)'
    }
  }, "Talita Issei"), /*#__PURE__*/React.createElement(GoldRule, {
    length: 56,
    gap: "20px 0 24px"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      ...homeBody,
      color: 'var(--be-ink-inverse)'
    }
  }, "J\xE1 vi dezenas de empres\xE1rios trabalhando 12 horas por dia porque o time n\xE3o decide nada sem eles. Antes de ajudar empres\xE1rios a resolver isso, passei mais de 15 anos gerindo projeto, processo e gente em opera\xE7\xF5es multinacionais \u2014 ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: 'var(--be-cream)',
      fontWeight: 500
    }
  }, "KPMG, Ita\xFA, Vivo, Accenture"), "."), /*#__PURE__*/React.createElement("p", {
    style: {
      ...homeBody,
      color: 'var(--be-ink-inverse)',
      margin: 0
    }
  }, "H\xE1 5 anos aplico essa bagagem em empresas de servi\xE7o, ajudando empres\xE1rios a identificar falha operacional e transformar time dependente em time que roda sozinho."))))), /*#__PURE__*/React.createElement(Section, null, /*#__PURE__*/React.createElement(Container, null, /*#__PURE__*/React.createElement("h2", {
    style: homeHeading
  }, "Para quem \xE9 a sess\xE3o"), /*#__PURE__*/React.createElement(PainList, {
    items: ['Empresas de serviço com equipe a partir de 5 colaboradores', 'Negócio com operação ativa e carteira de clientes em expansão', 'Fundadoras decididas a sair do operacional pra focar em gestão e crescimento']
  }))), /*#__PURE__*/React.createElement(Section, {
    tone: "white",
    rule: true
  }, /*#__PURE__*/React.createElement(Container, null, /*#__PURE__*/React.createElement("h2", {
    style: homeHeading
  }, "Como funciona a sele\xE7\xE3o"), /*#__PURE__*/React.createElement("p", {
    style: homeBody
  }, "Por ser uma an\xE1lise individual, conduzida diretamente por mim, libero apenas 3 vagas por semana."), /*#__PURE__*/React.createElement(StepList, {
    steps: ['Preenche o formulário de aplicação abaixo', 'Eu analiso se o momento da sua empresa se encaixa na metodologia', 'Com o perfil aprovado, minha equipe entra em contato pra agendar seu horário']
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 40
    }
  }, /*#__PURE__*/React.createElement(Button, {
    onClick: onApply
  }, "Solicitar Diagn\xF3stico Gratuito")))), /*#__PURE__*/React.createElement(Section, {
    rule: true
  }, /*#__PURE__*/React.createElement(Container, null, /*#__PURE__*/React.createElement(TldrBlock, null, "O Diagn\xF3stico Gratuito \xE9 uma sess\xE3o individual de 45 minutos que analisa a opera\xE7\xE3o de uma empresa de servi\xE7os e aponta onde a estrutura precisa de ajuste para o time rodar com autonomia. A an\xE1lise cobre tr\xEAs pontos: quais decis\xF5es ainda dependem s\xF3 da fundadora, em que etapa da entrega o time erra ou gera retrabalho, e onde a informa\xE7\xE3o se perde entre WhatsApp e rotina indefinida. S\xE3o tr\xEAs vagas por semana."), /*#__PURE__*/React.createElement(FaqAccordion, {
    style: {
      marginTop: 40
    },
    items: [{
      question: 'O que é o Diagnóstico Gratuito?',
      answer: 'O Diagnóstico Gratuito é uma sessão individual de 45 minutos, conduzida por Talita Issei, que analisa a operação da sua empresa de serviços e aponta onde a estrutura precisa de ajuste para o time rodar com autonomia.'
    }, {
      question: 'A sessão tem custo?',
      answer: 'Não. A sessão é gratuita e dura 45 minutos. Ao final, se fizer sentido para o seu momento, Talita apresenta como a reestruturação pode ser conduzida através da Boutique Empresarial.'
    }, {
      question: 'Para quem é a sessão?',
      answer: 'A sessão é para empresas de serviço com equipe a partir de 5 colaboradores, com operação ativa e carteira de clientes em expansão, conduzidas por fundadoras decididas a sair do operacional.'
    }, {
      question: 'Para quem a sessão não é?',
      answer: 'A sessão não é para negócio em fase inicial, para operação de uma pessoa só, nem para quem procura tática de marketing e crescimento rápido. Nesses casos a resposta é não.'
    }, {
      question: 'Como funciona a seleção?',
      answer: 'São três vagas por semana. Você preenche o formulário de aplicação, Talita analisa se o momento da sua empresa se encaixa na metodologia e, com o perfil aprovado, a equipe entra em contato para agendar o horário.'
    }]
  })))), /*#__PURE__*/React.createElement(SiteFooter, {
    promise: 'Quando tudo depende de você, o crescimento vira peso.\nNós transformamos isso em estrutura.',
    links: [{
      label: 'Política de Privacidade',
      href: '#'
    }, {
      label: 'Termos de Uso',
      href: '#'
    }]
  }));
}
Object.assign(window, {
  HomeScreen,
  SiteHeader,
  homeHeading,
  homeBody
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/site/HomeScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/site/ProgramScreen.jsx
try { (() => {
const {
  Container,
  Section,
  Button,
  Eyebrow,
  FindingCard,
  PainList,
  SiteFooter
} = window.BoutiqueEmpresarialDesignSystem_fbafa1;

/** The legacy programme page — the wider "Boutique Empresarial" offer, kept in
 *  the repo as index-legado.html. Same palette, uppercase eyebrow, three
 *  trademarked phases, centred manifesto. */
function ProgramScreen({
  onApply
}) {
  const h2 = {
    fontFamily: 'var(--font-serif)',
    fontWeight: 400,
    fontSize: 'clamp(2rem, 3vw, 2.5rem)',
    letterSpacing: '-0.02em',
    margin: '0 0 2rem'
  };
  const p = {
    fontFamily: 'var(--font-sans)',
    fontWeight: 300,
    fontSize: '1.125rem',
    lineHeight: 1.8,
    color: 'var(--be-ink-secondary)',
    margin: '0 0 1.5rem',
    maxWidth: '66ch'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--be-cream)'
    }
  }, /*#__PURE__*/React.createElement(SiteHeader, {
    onApply: onApply
  }), /*#__PURE__*/React.createElement("main", null, /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '80px 0 120px'
    }
  }, /*#__PURE__*/React.createElement(Container, null, /*#__PURE__*/React.createElement(Eyebrow, {
    spaced: true
  }, "Clareza \u2022 Estabilidade \u2022 Estrutura"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 'clamp(2.5rem, 4vw, 3.8rem)',
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
      margin: '0 0 1.5rem',
      maxWidth: '90%'
    }
  }, "Sua empresa s\xF3 funciona porque voc\xEA est\xE1 l\xE1 o tempo todo?"), /*#__PURE__*/React.createElement("p", {
    style: p
  }, "Estruture um neg\xF3cio que funcione com estabilidade, dire\xE7\xE3o e autonomia \u2014 mesmo quando voc\xEA sai de cena. A", ' ', /*#__PURE__*/React.createElement("strong", {
    style: {
      fontWeight: 600,
      color: 'var(--be-ink)'
    }
  }, "Boutique Empresarial\u2122"), " \xE9 um programa de estrutura\xE7\xE3o para empres\xE1rios que desejam sair do centro da opera\xE7\xE3o e preparar sua empresa para a nova economia."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(Button, {
    onClick: onApply
  }, "Aplicar para a Boutique")))), /*#__PURE__*/React.createElement(Section, {
    tone: "white",
    rule: true
  }, /*#__PURE__*/React.createElement(Container, null, /*#__PURE__*/React.createElement("h2", {
    style: h2
  }, "O colapso silencioso"), /*#__PURE__*/React.createElement("p", {
    style: p
  }, "Voc\xEA montou um time. A empresa cresce. O faturamento sobe. Mas tudo ainda passa por voc\xEA."), /*#__PURE__*/React.createElement(PainList, {
    items: ['O time trava sem a sua resposta.', 'Você resolve 90% das crises e imprevistos.', 'Férias? Só se levar o celular.', /*#__PURE__*/React.createElement(React.Fragment, null, "No fundo, voc\xEA sabe: ", /*#__PURE__*/React.createElement("strong", {
      style: {
        fontWeight: 600,
        color: 'var(--be-ink)'
      }
    }, "se parar 5 dias, o neg\xF3cio para junto."))]
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      ...p,
      marginTop: '2rem'
    }
  }, "Isso n\xE3o \xE9 liberdade. \xC9 sobreviv\xEAncia. Voc\xEA n\xE3o precisa de mais produtividade.", ' ', /*#__PURE__*/React.createElement("strong", {
    style: {
      fontWeight: 600,
      color: 'var(--be-ink)'
    }
  }, "Precisa de estrutura que respira.")))), /*#__PURE__*/React.createElement(Section, null, /*#__PURE__*/React.createElement(Container, null, /*#__PURE__*/React.createElement("h2", {
    style: h2
  }, "Arquitetura Operacional"), /*#__PURE__*/React.createElement("p", {
    style: p
  }, "N\xE3o somos uma mentoria. N\xE3o somos consultoria tradicional. Somos arquitetura empresarial sob medida. Nossa metodologia se baseia em 3 fases:"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 40,
      marginTop: 40
    }
  }, /*#__PURE__*/React.createElement(FindingCard, {
    number: "01",
    title: "Diagn\xF3stico de Estabilidade\u2122",
    hoverable: true
  }, "An\xE1lise profunda do que hoje trava, sobrecarrega ou depende exclusivamente de voc\xEA. Identificamos onde est\xE1 o ru\xEDdo."), /*#__PURE__*/React.createElement(FindingCard, {
    number: "02",
    title: "Arquitetura Operacional\u2122",
    hoverable: true
  }, "Estrutura\xE7\xE3o dos pilares que sustentam o neg\xF3cio sem a sua presen\xE7a di\xE1ria. Criamos processos leves e funcionais."), /*#__PURE__*/React.createElement(FindingCard, {
    number: "03",
    title: "Ritmo de Execu\xE7\xE3o\u2122",
    hoverable: true
  }, "Implementa\xE7\xE3o de um ritual de gest\xE3o e acompanhamento para manter a estabilidade e previsibilidade no dia a dia.")))), /*#__PURE__*/React.createElement(Section, null, /*#__PURE__*/React.createElement(Container, {
    style: {
      maxWidth: 700,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: h2
  }, "O fim do ru\xEDdo"), /*#__PURE__*/React.createElement("p", {
    style: {
      ...p,
      fontSize: '1.25rem',
      fontStyle: 'italic',
      color: 'var(--be-ink)',
      maxWidth: 'none'
    }
  }, "\u201CA maioria das empresas n\xE3o quebra por falta de cliente. Quebra porque o dono desaba antes da opera\xE7\xE3o sustentar o crescimento.\u201D"), /*#__PURE__*/React.createElement("p", {
    style: {
      ...p,
      fontSize: '1.25rem',
      fontStyle: 'italic',
      color: 'var(--be-ink)',
      maxWidth: 'none',
      margin: 0
    }
  }, "Aqui, n\xF3s estruturamos o que ningu\xE9m v\xEA. Alinhamos a funda\xE7\xE3o. Silenciamos o ru\xEDdo. Criamos estabilidade operacional onde antes havia sobreviv\xEAncia."))), /*#__PURE__*/React.createElement(Section, {
    tone: "white",
    rule: true
  }, /*#__PURE__*/React.createElement(Container, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 40
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 300
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontWeight: 600,
      fontSize: '1.5rem',
      margin: '0 0 1rem'
    }
  }, "Para quem \xE9"), /*#__PURE__*/React.createElement("p", {
    style: p
  }, "Empres\xE1rios que j\xE1 faturam R$ 50 mil/m\xEAs ou mais, possuem equipe e sentem que a empresa s\xF3 anda com a for\xE7a deles.")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 300
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontWeight: 600,
      fontSize: '1.5rem',
      margin: '0 0 1rem'
    }
  }, "Para quem n\xE3o \xE9"), /*#__PURE__*/React.createElement("p", {
    style: p
  }, "Neg\xF3cios iniciantes, quem busca \u201Cconsultoria express\u201D ou quem n\xE3o est\xE1 disposto a ajustar sua rotina com seriedade."))))), /*#__PURE__*/React.createElement(Section, {
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement(Container, null, /*#__PURE__*/React.createElement("h2", {
    style: h2
  }, "Sua aus\xEAncia n\xE3o deveria gerar p\xE2nico."), /*#__PURE__*/React.createElement("p", {
    style: {
      ...p,
      margin: '0 auto 1.5rem'
    }
  }, "As vagas s\xE3o limitadas a 5 empresas por ciclo. Se voc\xEA quer estruturar um neg\xF3cio est\xE1vel, leve e pronto para o futuro, aplique agora."), /*#__PURE__*/React.createElement(Button, {
    onClick: onApply
  }, "Preencher Aplica\xE7\xE3o")))), /*#__PURE__*/React.createElement(SiteFooter, {
    promise: 'Quando tudo depende de você, o crescimento vira peso.\nNós transformamos isso em estrutura.',
    links: [{
      label: 'Política de Privacidade',
      href: '#'
    }, {
      label: 'Termos de Uso',
      href: '#'
    }]
  }));
}
Object.assign(window, {
  ProgramScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/site/ProgramScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/social/CardSlides.jsx
try { (() => {
const {
  AuthorHeader,
  NotesBar,
  EditorialDivider,
  Checklist,
  SelectionHighlight,
  StepTitle
} = window.BoutiqueEmpresarialDesignSystem_fbafa1;
const ART_W = 1080;
const ART_H = 1350;

/** 4:5 Instagram artboard, scaled to fit its slot. Everything inside is
 *  authored at real 1080px dimensions so the type scale matches production. */
function Artboard({
  mode = 'light',
  scale = 0.4,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: ART_W * scale,
      height: ART_H * scale,
      overflow: 'hidden',
      flex: '0 0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: ART_W,
      height: ART_H,
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
      background: mode === 'dark' ? 'var(--ti-bg-dark-notepad)' : 'var(--ti-bg-paper)',
      color: mode === 'dark' ? 'var(--ti-dark-primary)' : 'var(--ti-ink-primary)',
      padding: '80px 72px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column'
    }
  }, children));
}
const cardH1 = {
  fontFamily: 'var(--font-serif)',
  fontWeight: 700,
  fontSize: 64,
  lineHeight: 1.15,
  letterSpacing: '-0.01em',
  margin: 0
};
const diag = {
  fontFamily: 'var(--font-serif)',
  fontWeight: 700,
  fontSize: 40,
  lineHeight: 1.3,
  margin: 0
};
const cta = {
  fontFamily: 'var(--font-serif)',
  fontStyle: 'italic',
  fontSize: 28,
  color: 'var(--ti-ink-muted)',
  margin: 0
};
const bigChecklist = {
  fontSize: 34
};

/** Slide 1 — Fachada Editorial: the hook. */
function SlideHook({
  scale
}) {
  return /*#__PURE__*/React.createElement(Artboard, {
    scale: scale
  }, /*#__PURE__*/React.createElement(AuthorHeader, {
    photoSrc: "../../assets/fotos/talita-issei.webp",
    size: 96,
    style: {
      gap: 28
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: cardH1
  }, "Sua empresa cresceu, o caos tamb\xE9m"), /*#__PURE__*/React.createElement(EditorialDivider, {
    width: 120,
    thickness: 4,
    gap: "56px 0 0"
  })), /*#__PURE__*/React.createElement("p", {
    style: cta
  }, "Continua\xE7\xE3o na legenda \uD83D\uDC47"));
}

/** Slide 2 — Fachada Editorial: the diagnosis + Estilo A checklist. */
function SlideDiagnosis({
  scale
}) {
  return /*#__PURE__*/React.createElement(Artboard, {
    scale: scale
  }, /*#__PURE__*/React.createElement(AuthorHeader, {
    photoSrc: "../../assets/fotos/talita-issei.webp",
    size: 72,
    style: {
      gap: 24
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: diag
  }, "Empres\xE1ria, voc\xEA contratou pra aliviar. Mas virou o \u201Cponto final\u201D de tudo."), /*#__PURE__*/React.createElement(Checklist, {
    style: {
      marginTop: 48,
      gap: 28
    },
    items: [/*#__PURE__*/React.createElement("span", {
      style: bigChecklist
    }, "\u201CRapidinho\u201D o dia inteiro."), /*#__PURE__*/React.createElement("span", {
      style: bigChecklist
    }, "Voc\xEA decide prioridade at\xE9 do que n\xE3o \xE9 seu."), /*#__PURE__*/React.createElement("span", {
      style: bigChecklist
    }, "Voc\xEA some e as coisas emperram.")]
  }), /*#__PURE__*/React.createElement(EditorialDivider, {
    width: 110,
    thickness: 4,
    gap: "56px 0 0"
  })), /*#__PURE__*/React.createElement("p", {
    style: cta
  }, "Continua\xE7\xE3o na legenda \uD83D\uDC47"));
}

/** Slide 3 — Bastidores: the promise, with one iOS-highlighted phrase. */
function SlideMethodIntro({
  scale
}) {
  return /*#__PURE__*/React.createElement(Artboard, {
    mode: "dark",
    scale: scale
  }, /*#__PURE__*/React.createElement(NotesBar, {
    style: {
      marginBottom: 0,
      fontSize: 32
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      ...cardH1,
      lineHeight: 1.7
    }
  }, "A estrutura de 4 etapas para organizar o seu time quando a", ' ', /*#__PURE__*/React.createElement(SelectionHighlight, null, "empresa cresce no caos"))));
}

/** Slide 4 — Bastidores: the work, with the Estilo B checklist. */
function SlideMethodStep({
  scale
}) {
  return /*#__PURE__*/React.createElement(Artboard, {
    mode: "dark",
    scale: scale
  }, /*#__PURE__*/React.createElement(NotesBar, {
    style: {
      marginBottom: 0,
      fontSize: 32
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(StepTitle, {
    style: {
      fontSize: 44,
      marginBottom: 40
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: 'var(--ti-accent-amber)',
      fontWeight: 700
    }
  }, "Etapa 1"), " - Manuais simples (sem burocracia)"), /*#__PURE__*/React.createElement(Checklist, {
    variant: "method",
    style: {
      gap: 32
    },
    items: [/*#__PURE__*/React.createElement("span", {
      style: bigChecklist
    }, "Mapeie as tarefas que mais d\xE3o erro, as repetitivas e as que tomam mais tempo."), /*#__PURE__*/React.createElement("span", {
      style: bigChecklist
    }, "Grave a tela do computador no momento exato em que estiver executando a tarefa."), /*#__PURE__*/React.createElement("span", {
      style: bigChecklist
    }, "Salve os links dos v\xEDdeos, arquivos e acessos num documento centralizado.")]
  })));
}
const SLIDES = [{
  id: 'hook',
  label: '01 · Gancho',
  mode: 'light',
  Comp: SlideHook
}, {
  id: 'diag',
  label: '02 · Diagnóstico',
  mode: 'light',
  Comp: SlideDiagnosis
}, {
  id: 'intro',
  label: '03 · Método',
  mode: 'dark',
  Comp: SlideMethodIntro
}, {
  id: 'step',
  label: '04 · Etapa',
  mode: 'dark',
  Comp: SlideMethodStep
}];
Object.assign(window, {
  Artboard,
  SlideHook,
  SlideDiagnosis,
  SlideMethodIntro,
  SlideMethodStep,
  SLIDES
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/social/CardSlides.jsx", error: String((e && e.message) || e) }); }

__ds_ns.CheckboxOption = __ds_scope.CheckboxOption;

__ds_ns.FormStep = __ds_scope.FormStep;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.RadioGroup = __ds_scope.RadioGroup;

__ds_ns.ScaleSelect = __ds_scope.ScaleSelect;

__ds_ns.StepDots = __ds_scope.StepDots;

__ds_ns.TextField = __ds_scope.TextField;

__ds_ns.Hint = __ds_scope.Hint;

__ds_ns.FieldError = __ds_scope.FieldError;

__ds_ns.ApplyLink = __ds_scope.ApplyLink;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Container = __ds_scope.Container;

__ds_ns.Eyebrow = __ds_scope.Eyebrow;

__ds_ns.FaqAccordion = __ds_scope.FaqAccordion;

__ds_ns.FindingCard = __ds_scope.FindingCard;

__ds_ns.GoldRule = __ds_scope.GoldRule;

__ds_ns.PainList = __ds_scope.PainList;

__ds_ns.Section = __ds_scope.Section;

__ds_ns.SiteFooter = __ds_scope.SiteFooter;

__ds_ns.StepList = __ds_scope.StepList;

__ds_ns.StickyCta = __ds_scope.StickyCta;

__ds_ns.TldrBlock = __ds_scope.TldrBlock;

__ds_ns.Wordmark = __ds_scope.Wordmark;

__ds_ns.AuthorHeader = __ds_scope.AuthorHeader;

__ds_ns.Checklist = __ds_scope.Checklist;

__ds_ns.ContentCard = __ds_scope.ContentCard;

__ds_ns.StepTitle = __ds_scope.StepTitle;

__ds_ns.EditorialDivider = __ds_scope.EditorialDivider;

__ds_ns.ModeTag = __ds_scope.ModeTag;

__ds_ns.NotesBar = __ds_scope.NotesBar;

__ds_ns.SelectionHighlight = __ds_scope.SelectionHighlight;

})();

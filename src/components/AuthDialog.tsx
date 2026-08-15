import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Check, CircleAlert, Eye, EyeOff, KeyRound, LoaderCircle, LogOut, Package, ReceiptText, RefreshCw, UserRound, X } from 'lucide-react'
import {
  AuthApiError,
  changePassword,
  login,
  logout,
  logoutEverywhere,
  readOrderHistory,
  register,
  updateProfile,
  type OrderHistory,
  type OrderStatus,
  type Profile,
} from '../auth.ts'

const TITLE_ID = 'auth-dialog-title'
const PASSWORD_HINT_ID = 'auth-password-hint'
const PROFILE_PASSWORD_HINT_ID = 'profile-password-hint'
const MIN_PASSWORD_LENGTH = 8
const moneyFormatter = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' })
const dateFormatter = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })
const orderStatus: Record<OrderStatus, { label: string, tone: string }> = {
  pending: { label: 'Ожидает оплаты', tone: 'pending' },
  paid: { label: 'Оплачен', tone: 'paid' },
  processing: { label: 'В работе', tone: 'processing' },
  completed: { label: 'Выполнен', tone: 'completed' },
  cancelled: { label: 'Отменён', tone: 'cancelled' },
  refunded: { label: 'Возврат', tone: 'refunded' },
}
const motionDuration = (ms: number) => (
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? Math.min(ms, 480)
    : ms
)

type AuthMode = 'login' | 'register'
type FieldName = 'displayName' | 'email' | 'password'
type FieldErrors = Partial<Record<FieldName, string>>
type PasswordFieldName = 'currentPassword' | 'newPassword' | 'confirmPassword'
type PasswordFieldErrors = Partial<Record<PasswordFieldName, string>>

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u

function validateDisplayName(value: string) {
  const normalized = value.trim()
  if (!normalized) return 'Введите имя профиля'
  if (Array.from(normalized).length > 50) return 'Имя профиля не должно быть длиннее 50 символов'
  return ''
}

function validateEmail(value: string) {
  const normalized = value.normalize('NFKC').trim()
  if (!normalized) return 'Введите email'
  if (new TextEncoder().encode(normalized).length > 254) return 'Email слишком длинный'
  if (!emailPattern.test(normalized)) return 'Введите email в формате name@example.com'
  return ''
}

function validatePassword(value: string) {
  if (!value) return 'Введите пароль'
  if (Array.from(value).length < MIN_PASSWORD_LENGTH) {
    return `Пароль должен содержать минимум ${MIN_PASSWORD_LENGTH} символов`
  }
  if (new TextEncoder().encode(value).length > 128) return 'Пароль слишком длинный'
  return ''
}

function formatMoney(kopecks: number) {
  return moneyFormatter.format(kopecks / 100)
}

function errorMessage(value: unknown) {
  if (value instanceof AuthApiError) return value.message
  return 'Сервер профиля недоступен. Попробуйте ещё раз'
}

function FieldError({ id, message }: { id: string, message?: string }) {
  if (!message) return null
  return (
    <p key={message} id={id} className="auth-field-error" role="alert">
      <CircleAlert className="w-3.5 h-3.5" aria-hidden="true" />
      {message}
    </p>
  )
}

export function AuthDialog({ profile, onProfileChange, onClose }: {
  profile: Profile | null
  onProfileChange: (profile: Profile | null) => void
  onClose: () => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const authFormFrameRef = useRef<HTMLDivElement>(null)
  const authFormHeightRef = useRef(0)
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const passwordSavedTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const onCloseRef = useRef(onClose)
  const [closing, setClosing] = useState(false)
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState(profile?.displayName || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showProfilePasswords, setShowProfilePasswords] = useState(false)
  const [pending, setPending] = useState(false)
  const [passwordPending, setPasswordPending] = useState(false)
  const [error, setError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<PasswordFieldErrors>({})
  const [saved, setSaved] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [orderHistory, setOrderHistory] = useState<OrderHistory | null>(null)
  const [ordersError, setOrdersError] = useState('')
  const [ordersReload, setOrdersReload] = useState(0)
  const profileId = profile?.id
  const ordersLoading = Boolean(profileId && !orderHistory && !ordersError)

  const initials = useMemo(() => {
    const source = profile?.displayName || profile?.email || 'C'
    return source.trim().slice(0, 2).toUpperCase()
  }, [profile])

  const requestClose = () => {
    if (closing) return
    setClosing(true)
    closeTimer.current = setTimeout(() => onCloseRef.current(), motionDuration(520))
  }

  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setClosing(true)
      clearTimeout(closeTimer.current)
      closeTimer.current = setTimeout(() => onCloseRef.current(), motionDuration(520))
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      clearTimeout(closeTimer.current)
      clearTimeout(savedTimer.current)
      clearTimeout(passwordSavedTimer.current)
    }
  }, [])

  useLayoutEffect(() => {
    const frame = authFormFrameRef.current
    const content = frame?.firstElementChild
    if (!frame || !(content instanceof HTMLElement)) return

    let animationFrame = 0
    const resize = () => {
      const nextHeight = content.scrollHeight
      const previousHeight = authFormHeightRef.current || nextHeight
      cancelAnimationFrame(animationFrame)
      frame.style.height = `${previousHeight}px`
      animationFrame = requestAnimationFrame(() => {
        frame.style.height = `${nextHeight}px`
        authFormHeightRef.current = nextHeight
      })
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(content)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(animationFrame)
    }
  }, [mode])

  useEffect(() => {
    if (!profileId) return
    const controller = new AbortController()
    readOrderHistory(controller.signal)
      .then(setOrderHistory)
      .catch((value) => {
        if (value instanceof DOMException && value.name === 'AbortError') return
        setOrdersError(errorMessage(value))
      })
    return () => controller.abort()
  }, [profileId, ordersReload])

  const clearFieldError = (field: FieldName) => {
    setFieldErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const setFieldError = (field: FieldName, message: string) => {
    setFieldErrors((current) => {
      if (current[field] === message) return current
      const next = { ...current }
      if (message) next[field] = message
      else delete next[field]
      return next
    })
  }

  const clearPasswordFieldError = (field: PasswordFieldName) => {
    setPasswordFieldErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const setPasswordFieldError = (field: PasswordFieldName, message: string) => {
    setPasswordFieldErrors((current) => {
      if (current[field] === message) return current
      const next = { ...current }
      if (message) next[field] = message
      else delete next[field]
      return next
    })
  }

  const focusFirstInvalid = (form: HTMLFormElement, errors: FieldErrors) => {
    const firstField = Object.keys(errors)[0] as FieldName | undefined
    const control = firstField ? form.elements.namedItem(firstField) : null
    if (control instanceof HTMLElement) control.focus()
  }

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: FieldErrors = {
      ...(mode === 'register' ? { displayName: validateDisplayName(displayName) } : {}),
      email: validateEmail(email),
      password: validatePassword(password),
    }
    Object.keys(nextErrors).forEach((field) => {
      if (!nextErrors[field as FieldName]) delete nextErrors[field as FieldName]
    })
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors)
      setError('')
      focusFirstInvalid(event.currentTarget, nextErrors)
      return
    }
    setFieldErrors({})
    setPending(true)
    setError('')
    try {
      const next = mode === 'login'
        ? await login(email, password)
        : await register(email, password, displayName)
      setDisplayName(next.displayName)
      setOrderHistory(null)
      setOrdersError('')
      onProfileChange(next)
      setPassword('')
    } catch (value) {
      if (mode === 'register' && value instanceof AuthApiError && value.code === 'ACCOUNT_UNAVAILABLE') {
        setFieldErrors({ email: 'Аккаунт с таким email уже зарегистрирован' })
        setError('')
        emailRef.current?.focus()
      } else {
        setError(errorMessage(value))
      }
    } finally {
      setPending(false)
    }
  }

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: FieldErrors = {
      displayName: validateDisplayName(displayName),
    }
    Object.keys(nextErrors).forEach((field) => {
      if (!nextErrors[field as FieldName]) delete nextErrors[field as FieldName]
    })
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors)
      setError('')
      focusFirstInvalid(event.currentTarget, nextErrors)
      return
    }
    setFieldErrors({})
    setPending(true)
    setSaved(false)
    setError('')
    try {
      const next = await updateProfile(displayName)
      onProfileChange(next)
      setSaved(true)
      clearTimeout(savedTimer.current)
      savedTimer.current = setTimeout(() => setSaved(false), 1600)
    } catch (value) {
      setError(errorMessage(value))
    } finally {
      setPending(false)
    }
  }

  const changeProfilePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const nextErrors: PasswordFieldErrors = {
      currentPassword: currentPassword ? '' : 'Введите текущий пароль',
      newPassword: validatePassword(newPassword),
      confirmPassword: confirmPassword
        ? (confirmPassword === newPassword ? '' : 'Пароли не совпадают')
        : 'Повторите новый пароль',
    }
    if (currentPassword && currentPassword === newPassword) {
      nextErrors.newPassword = 'Новый пароль должен отличаться от текущего'
    }
    Object.keys(nextErrors).forEach((field) => {
      if (!nextErrors[field as PasswordFieldName]) delete nextErrors[field as PasswordFieldName]
    })
    if (Object.keys(nextErrors).length) {
      setPasswordFieldErrors(nextErrors)
      setPasswordError('')
      const firstField = Object.keys(nextErrors)[0] as PasswordFieldName
      const control = form.elements.namedItem(firstField)
      if (control instanceof HTMLElement) control.focus()
      return
    }

    setPasswordFieldErrors({})
    setPasswordError('')
    setPasswordSaved(false)
    setPasswordPending(true)
    try {
      const next = await changePassword(currentPassword, newPassword)
      onProfileChange(next)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSaved(true)
      clearTimeout(passwordSavedTimer.current)
      passwordSavedTimer.current = setTimeout(() => setPasswordSaved(false), 1800)
    } catch (value) {
      if (value instanceof AuthApiError && value.code === 'INVALID_CURRENT_PASSWORD') {
        setPasswordFieldErrors({ currentPassword: 'Текущий пароль указан неверно' })
        const control = form.elements.namedItem('currentPassword')
        if (control instanceof HTMLElement) control.focus()
      } else if (value instanceof AuthApiError && value.code === 'AUTH_REQUIRED') {
        onProfileChange(null)
        setError('Сессия истекла. Войдите снова')
        setMode('login')
      } else {
        setPasswordError(errorMessage(value))
      }
    } finally {
      setPasswordPending(false)
    }
  }

  const signOut = async (all: boolean) => {
    setPending(true)
    setError('')
    try {
      if (all) await logoutEverywhere()
      else await logout()
      onProfileChange(null)
      setOrderHistory(null)
      setOrdersError('')
      setEmail('')
      setPassword('')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMode('login')
    } catch (value) {
      setError(errorMessage(value))
    } finally {
      setPending(false)
    }
  }

  return (
    <div
      className={`auth-overlay fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 ${closing ? 'is-exiting' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={TITLE_ID}
    >
      <div className="overlay-backdrop auth-backdrop absolute inset-0" onClick={requestClose} />
      <div className={`auth-dialog glass glass-blur relative w-full ${profile ? 'max-w-xl' : 'max-w-md'} max-h-[90svh] overflow-x-hidden overflow-y-auto rounded-3xl p-5 sm:p-6`}>
        <button
          ref={closeRef}
          onClick={requestClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-lg bg-black/35 flex items-center justify-center hover:bg-black/60 transition-colors"
          aria-label="Закрыть профиль"
        >
          <X className="w-4 h-4 text-white/65" />
        </button>

        {profile ? (
          <div className="auth-dialog-body flex flex-col gap-5">
            <div className="flex items-center gap-4 pr-10">
              <div className="profile-avatar shrink-0 w-12 h-12 rounded-2xl bg-white text-[#070708] flex items-center justify-center text-sm font-bold">
                {initials}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] tracking-[0.25em] uppercase text-brand/70">Профиль</span>
                <h2 id={TITLE_ID} className="text-xl sm:text-2xl font-bold mt-0.5 truncate">{profile.displayName}</h2>
                <p className="text-xs text-white/35 truncate mt-0.5">{profile.email}</p>
              </div>
            </div>

            <div className="h-px bg-white/[0.07]" />

            <section aria-labelledby="profile-orders-title" className="profile-orders">
              <div className="profile-stats" aria-label="Статистика покупок">
                <div>
                  <strong>{orderHistory?.stats.totalOrders ?? 0}</strong>
                  <span>заказов</span>
                </div>
                <div>
                  <strong>{orderHistory?.stats.totalItems ?? 0}</strong>
                  <span>товаров</span>
                </div>
                <div>
                  <strong>{formatMoney(orderHistory?.stats.totalSpentKopecks ?? 0)}</strong>
                  <span>сумма покупок</span>
                </div>
              </div>

              <div className="profile-orders-heading">
                <div>
                  <span className="text-[10px] tracking-[0.2em] uppercase text-white/30">Покупки</span>
                  <h3 id="profile-orders-title">История заказов</h3>
                </div>
                {ordersLoading && <LoaderCircle className="w-4 h-4 animate-spin text-white/30" aria-label="Загрузка заказов" />}
              </div>

              {ordersError ? (
                <div className="profile-orders-state" role="alert">
                  <CircleAlert className="w-5 h-5" />
                  <span>{ordersError}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setOrderHistory(null)
                      setOrdersError('')
                      setOrdersReload((value) => value + 1)
                    }}
                    aria-label="Повторить загрузку заказов"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              ) : !ordersLoading && orderHistory?.orders.length === 0 ? (
                <div className="profile-orders-state">
                  <ReceiptText className="w-5 h-5" />
                  <span>Подтверждённых заказов пока нет</span>
                </div>
              ) : (
                <div className="profile-order-list">
                  {orderHistory?.orders.map((order) => {
                    const status = orderStatus[order.status]
                    const itemSummary = order.items
                      .map((item) => `${item.title}${item.quantity > 1 ? ` × ${item.quantity}` : ''}`)
                      .join(', ')
                    return (
                      <article key={order.reference} className="profile-order-row">
                        <div className="profile-order-main">
                          <div className="profile-order-reference">
                            <span>#{order.reference}</span>
                            <time dateTime={order.createdAt}>{dateFormatter.format(new Date(order.createdAt))}</time>
                          </div>
                          <p title={itemSummary}>{itemSummary}</p>
                        </div>
                        <div className="profile-order-total">
                          <span className={`profile-order-status is-${status.tone}`}>{status.label}</span>
                          <strong>{formatMoney(order.totalKopecks)}</strong>
                          <small><Package className="w-3 h-3" /> {order.itemCount}</small>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>

            <form noValidate onSubmit={saveProfile} className="profile-details-form flex flex-col gap-3">
              <div className="profile-edit-heading">
                <span>Данные профиля</span>
              </div>

              <label className={`auth-field ${fieldErrors.displayName ? 'is-invalid' : ''}`}>
                <span>Имя профиля</span>
                <input
                  name="displayName"
                  value={displayName}
                  onChange={(event) => { setDisplayName(event.target.value); clearFieldError('displayName') }}
                  onBlur={(event) => setFieldError('displayName', validateDisplayName(event.target.value))}
                  minLength={1}
                  maxLength={50}
                  required
                  aria-invalid={Boolean(fieldErrors.displayName)}
                  aria-describedby={fieldErrors.displayName ? 'profile-display-name-error' : undefined}
                  autoComplete="name"
                />
                <FieldError id="profile-display-name-error" message={fieldErrors.displayName} />
              </label>

              {error && <p key={error} className="auth-error" role="alert">{error}</p>}

              <button type="submit" disabled={pending || passwordPending} className="auth-primary">
                {pending && <LoaderCircle className="w-4 h-4 animate-spin" />}
                {!pending && saved && <Check className="w-4 h-4 auth-icon-swap" />}
                {saved ? 'Сохранено' : pending ? 'Сохраняем...' : 'Сохранить профиль'}
              </button>
            </form>

            <form noValidate onSubmit={changeProfilePassword} className="profile-security-form flex flex-col gap-3">
              <div className="profile-edit-heading profile-security-heading">
                <span className="inline-flex items-center gap-2"><KeyRound className="w-3.5 h-3.5" /> Безопасность</span>
              </div>

              <label className={`auth-field ${passwordFieldErrors.currentPassword ? 'is-invalid' : ''}`}>
                <span>Текущий пароль</span>
                <div className="relative">
                  <input
                    name="currentPassword"
                    type={showProfilePasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(event) => { setCurrentPassword(event.target.value); clearPasswordFieldError('currentPassword') }}
                    onBlur={(event) => setPasswordFieldError('currentPassword', event.target.value ? '' : 'Введите текущий пароль')}
                    maxLength={128}
                    required
                    aria-invalid={Boolean(passwordFieldErrors.currentPassword)}
                    aria-describedby={passwordFieldErrors.currentPassword ? 'profile-current-password-error' : undefined}
                    autoComplete="current-password"
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowProfilePasswords((value) => !value)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-colors"
                    aria-label={showProfilePasswords ? 'Скрыть пароли' : 'Показать пароли'}
                  >
                    {showProfilePasswords ? <EyeOff className="auth-icon-swap w-4 h-4" /> : <Eye className="auth-icon-swap w-4 h-4" />}
                  </button>
                </div>
                <FieldError id="profile-current-password-error" message={passwordFieldErrors.currentPassword} />
              </label>

              <label className={`auth-field ${passwordFieldErrors.newPassword ? 'is-invalid' : ''}`}>
                <span>Новый пароль</span>
                <input
                  name="newPassword"
                  type={showProfilePasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(event) => { setNewPassword(event.target.value); clearPasswordFieldError('newPassword') }}
                  onBlur={(event) => setPasswordFieldError('newPassword', validatePassword(event.target.value))}
                  minLength={MIN_PASSWORD_LENGTH}
                  maxLength={128}
                  required
                  aria-invalid={Boolean(passwordFieldErrors.newPassword)}
                  aria-describedby={`${PROFILE_PASSWORD_HINT_ID}${passwordFieldErrors.newPassword ? ' profile-new-password-error' : ''}`}
                  autoComplete="new-password"
                />
                <small id={PROFILE_PASSWORD_HINT_ID} className="auth-password-hint">Минимум {MIN_PASSWORD_LENGTH} символов</small>
                <FieldError id="profile-new-password-error" message={passwordFieldErrors.newPassword} />
              </label>

              <label className={`auth-field ${passwordFieldErrors.confirmPassword ? 'is-invalid' : ''}`}>
                <span>Повторите новый пароль</span>
                <input
                  name="confirmPassword"
                  type={showProfilePasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => { setConfirmPassword(event.target.value); clearPasswordFieldError('confirmPassword') }}
                  onBlur={(event) => setPasswordFieldError(
                    'confirmPassword',
                    event.target.value
                      ? (event.target.value === newPassword ? '' : 'Пароли не совпадают')
                      : 'Повторите новый пароль',
                  )}
                  minLength={MIN_PASSWORD_LENGTH}
                  maxLength={128}
                  required
                  aria-invalid={Boolean(passwordFieldErrors.confirmPassword)}
                  aria-describedby={passwordFieldErrors.confirmPassword ? 'profile-confirm-password-error' : undefined}
                  autoComplete="new-password"
                />
                <FieldError id="profile-confirm-password-error" message={passwordFieldErrors.confirmPassword} />
              </label>

              {passwordError && <p key={passwordError} className="auth-error" role="alert">{passwordError}</p>}

              <button type="submit" disabled={pending || passwordPending} className="auth-secondary profile-password-submit">
                {passwordPending && <LoaderCircle className="w-4 h-4 animate-spin" />}
                {!passwordPending && passwordSaved && <Check className="w-4 h-4 auth-icon-swap" />}
                {passwordSaved ? 'Пароль изменён' : passwordPending ? 'Меняем пароль...' : 'Изменить пароль'}
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button type="button" disabled={pending || passwordPending} onClick={() => signOut(false)} className="auth-secondary">
                <LogOut className="w-4 h-4" />
                Выйти
              </button>
              <button type="button" disabled={pending || passwordPending} onClick={() => signOut(true)} className="text-xs text-white/30 hover:text-white/60 transition-colors">
                Выйти на всех устройствах
              </button>
            </div>
          </div>
        ) : (
          <div className="auth-dialog-body flex flex-col gap-5">
            <div className="pr-10">
              <span className="inline-flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase text-brand/70">
                <UserRound className="w-3.5 h-3.5" />
                Аккаунт Castello
              </span>
              <h2 key={mode} id={TITLE_ID} className="auth-title-swap text-2xl sm:text-3xl font-bold mt-2">
                {mode === 'login' ? 'С возвращением' : 'Создать профиль'}
              </h2>
            </div>

            <div className="auth-tabs" role="tablist" aria-label="Авторизация">
              <span aria-hidden className={`auth-tab-indicator ${mode === 'register' ? 'is-register' : ''}`} />
              <button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => { setMode('login'); setError(''); setFieldErrors({}) }} className={mode === 'login' ? 'is-active' : ''}>
                Вход
              </button>
              <button type="button" role="tab" aria-selected={mode === 'register'} onClick={() => { setMode('register'); setError(''); setFieldErrors({}) }} className={mode === 'register' ? 'is-active' : ''}>
                Регистрация
              </button>
            </div>

            <div ref={authFormFrameRef} className="auth-form-frame">
            <form key={mode} noValidate onSubmit={submitAuth} className="auth-form-swap flex flex-col gap-4">
              {mode === 'register' && (
                <label className={`auth-field auth-stagger ${fieldErrors.displayName ? 'is-invalid' : ''}`}>
                  <span>Имя профиля</span>
                  <input
                    name="displayName"
                    value={displayName}
                    onChange={(event) => { setDisplayName(event.target.value); clearFieldError('displayName') }}
                    onBlur={(event) => setFieldError('displayName', validateDisplayName(event.target.value))}
                    minLength={1}
                    maxLength={50}
                    required
                    aria-invalid={Boolean(fieldErrors.displayName)}
                    aria-describedby={fieldErrors.displayName ? 'auth-display-name-error' : undefined}
                    autoComplete="name"
                  />
                  <FieldError id="auth-display-name-error" message={fieldErrors.displayName} />
                </label>
              )}

              <label className={`auth-field auth-stagger ${fieldErrors.email ? 'is-invalid' : ''}`}>
                <span>Email</span>
                <input
                  ref={emailRef}
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => { setEmail(event.target.value); clearFieldError('email') }}
                  onBlur={(event) => setFieldError('email', validateEmail(event.target.value))}
                  maxLength={254}
                  required
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'auth-email-error' : undefined}
                  autoComplete="email"
                  inputMode="email"
                />
                <FieldError id="auth-email-error" message={fieldErrors.email} />
              </label>

              <label className={`auth-field auth-stagger ${fieldErrors.password ? 'is-invalid' : ''}`}>
                <span>Пароль</span>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => { setPassword(event.target.value); clearFieldError('password') }}
                    onBlur={(event) => setFieldError('password', validatePassword(event.target.value))}
                    minLength={MIN_PASSWORD_LENGTH}
                    maxLength={128}
                    required
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={`${PASSWORD_HINT_ID}${fieldErrors.password ? ' auth-password-error' : ''}`}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-colors"
                    aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  >
                    {showPassword ? <EyeOff key="hidden" className="auth-icon-swap w-4 h-4" /> : <Eye key="visible" className="auth-icon-swap w-4 h-4" />}
                  </button>
                </div>
                <small id={PASSWORD_HINT_ID} className="auth-password-hint">
                  Минимум {MIN_PASSWORD_LENGTH} символов
                </small>
                <FieldError id="auth-password-error" message={fieldErrors.password} />
              </label>

              {error && <p key={error} className="auth-error" role="alert">{error}</p>}

              <button type="submit" disabled={pending} className="auth-primary mt-1">
                {pending && <LoaderCircle className="w-4 h-4 animate-spin" />}
                {pending ? 'Проверяем...' : mode === 'login' ? 'Войти' : 'Создать профиль'}
              </button>
            </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

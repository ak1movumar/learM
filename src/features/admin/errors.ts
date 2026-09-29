import { getApiFailure } from '@/services/api/errors';
import type { Locale } from '@/i18n/config';
const messages = {
  ru: {
    network:
      'Нет ответа сервера. Проверьте подключение. Перед повтором обновите список: действие могло сохраниться.',
    auth: 'Сессия истекла. Войдите снова.',
    forbidden: 'Сервер отказал в доступе. Нужны права администратора.',
    missing: 'Запись больше не найдена. Обновите список.',
    method: 'Сервер не поддерживает это действие по указанному адресу.',
    conflict:
      'Конфликт данных. Возможно, запись связана с другими материалами или результатами учеников. Требуется проверка на сервере.',
    invalid:
      'Сервер отклонил данные. Проверьте обязательные поля, значения и связи.',
    rate: 'Слишком много запросов. Подождите и повторите.',
    server:
      'Ошибка на сервере. Администратору бэкенда нужно проверить журнал этого запроса. Обновите список перед повтором.',
    unknown: 'Не удалось выполнить действие.',
  },
  en: {
    network:
      'No response. Check your connection and refresh before retrying: the action may have been saved.',
    auth: 'Session expired. Sign in again.',
    forbidden: 'Administrator access is required.',
    missing: 'Record not found. Refresh the list.',
    method: 'The server does not support this action at this address.',
    conflict:
      'Data conflict. Related content or student results may prevent this action. A server check is needed.',
    invalid:
      'The server rejected the data. Check required fields, values and relationships.',
    rate: 'Too many requests. Wait and retry.',
    server:
      'Server error. The backend administrator must check the request logs. Refresh before retrying.',
    unknown: 'The action failed.',
  },
  ky: {
    network:
      'Сервер жооп берген жок. Байланышты текшерип, кайталоодон мурун тизмени жаңыртыңыз.',
    auth: 'Сессия бүттү. Кайра кириңиз.',
    forbidden: 'Администратор укугу талап кылынат.',
    missing: 'Жазуу табылган жок. Тизмени жаңыртыңыз.',
    method: 'Сервер бул аракетти колдобойт.',
    conflict:
      'Маалыматтар кагылышты. Байланышкан материалдарды жана окуучулардын жыйынтыктарын серверден текшерүү керек.',
    invalid:
      'Сервер маалыматтарды кабыл алган жок. Талааларды жана байланыштарды текшериңиз.',
    rate: 'Сурамдар өтө көп. Бир аздан кийин кайталаңыз.',
    server:
      'Серверде ката кетти. Бэкенд администратору сурамдын журналын текшериши керек.',
    unknown: 'Аракет аткарылган жок.',
  },
};
export function adminErrorMessage(error: unknown, locale: Locale) {
  const { kind, status } = getApiFailure(error);
  const t = messages[locale];
  const message =
    kind === 'network'
      ? t.network
      : status === 401
        ? t.auth
        : status === 403
          ? t.forbidden
          : status === 404
            ? t.missing
            : status === 405
              ? t.method
              : status === 409
                ? t.conflict
                : status === 400 || status === 422
                  ? t.invalid
                  : status === 429
                    ? t.rate
                    : status && status >= 500
                      ? t.server
                      : t.unknown;
  return message + (status ? ` (HTTP ${status})` : '');
}

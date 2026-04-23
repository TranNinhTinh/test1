/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface RegisterDto {
  /**
   * User email address
   * @example "user@example.com"
   */
  email: string;
  /**
   * Phone number with country code
   * @example "+84901234567"
   */
  phone: string;
  /**
   * Full name of the user
   * @example "John Doe"
   */
  fullName: string;
  /**
   * Strong password (min 8 chars, uppercase, lowercase, number, symbol)
   * @example "Password123!"
   */
  password: string;
}

export interface RegisterResponseDataDto {
  /** @example "1a2b3c4d-5678-90ef" */
  id: string;
  email?: string;
  phone?: string;
  fullName?: string;
}

export interface RegisterResponseDto {
  /** @example true */
  success: boolean;
  /** @example "Register successful" */
  message: string;
  data: RegisterResponseDataDto | null;
}

export interface ErrorResponseDto {
  /** @example false */
  success: boolean;
  /** @example 401 */
  statusCode: number;
  /** @example "INVALID_CREDENTIALS" */
  code: string;
  /** @example "Invalid email or password" */
  message: string;
  /** @example "/auth/login" */
  path: string;
  /** @example "2025-11-04T07:26:05.344Z" */
  timestamp: string;
  /** @example {"field":"email","reason":"invalid format"} */
  details?: object;
}

export interface LoginDto {
  /** Email or phone */
  identifier: string;
  password: string;
}

export interface LoginResponseDataDto {
  /** @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." */
  accessToken: string;
  /** @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." */
  refreshToken: string;
  /** @example {"id":"1a2b3c4d-5678-90ef","email":"user@example.com","name":"Van Tin","role":"CUSTERMOR"} */
  user: object;
}

export interface LoginResponseDto {
  /** @example true */
  success: boolean;
  /** @example "Login successful" */
  message: string;
  data: LoginResponseDataDto | null;
}

export interface LoginMobileDto {
  /** Email or phone */
  identifier: string;
  password: string;
}

export interface PostResponseDto {
  /** @example "uuid-123" */
  id: string;
  /** @example "Cần thợ sửa điện nước" */
  title: string;
  /** @example "Mô tả chi tiết..." */
  description: string;
  imageUrls?: string[];
  /** @example "Quận 1, TP.HCM" */
  location?: string;
  /**
   * @format date-time
   * @example "2025-11-20T10:00:00Z"
   */
  desiredTime?: string;
  /** @example 500000 */
  budget?: number;
  /** @example "OPEN" */
  status: "OPEN" | "CLOSED";
  /** @example "uuid-456" */
  customerId: string;
  /** Customer information */
  customer: {
    id?: string;
    fullName?: string;
    avatarUrl?: string;
  };
  /**
   * @format date-time
   * @example "2025-11-13T10:00:00Z"
   */
  createdAt: string;
  /**
   * @format date-time
   * @example "2025-11-13T10:00:00Z"
   */
  updatedAt: string;
}

export interface FeedResponseDto {
  data: PostResponseDto[];
  /**
   * Next cursor for pagination
   * @example "2025-11-13T09:00:00.000Z"
   */
  nextCursor?: string;
  /** @example 10 */
  total: number;
  /** @example true */
  hasMore: boolean;
}

export interface CreatePostDto {
  /**
   * Post title
   * @example "Cần thợ sửa điện nước tại nhà"
   */
  title: string;
  /**
   * Detailed description
   * @example "Cần sửa chữa hệ thống điện và thay vòi nước bị hỏng"
   */
  description: string;
  /**
   * Image URLs
   * @example ["https://cohangxomdamdang/image1.jpg"]
   */
  imageUrls?: string[];
  /**
   * Service location
   * @example "Quận 1, TP.HCM"
   */
  location?: string;
  /**
   * Desired completion time
   * @format date-time
   * @example "2025-11-20T10:00:00Z"
   */
  desiredTime?: string;
  /**
   * Budget in VND
   * @example 500000
   */
  budget?: number;
}

export interface UpdatePostDto {
  /**
   * Post title
   * @example "Cần thợ sửa điện nước tại nhà"
   */
  title?: string;
  /**
   * Detailed description
   * @example "Cần sửa chữa hệ thống điện và thay vòi nước bị hỏng"
   */
  description?: string;
  /**
   * Image URLs
   * @example ["https://cohangxomdamdang/image1.jpg"]
   */
  imageUrls?: string[];
  /**
   * Service location
   * @example "Quận 1, TP.HCM"
   */
  location?: string;
  /**
   * Desired completion time
   * @format date-time
   * @example "2025-11-20T10:00:00Z"
   */
  desiredTime?: string;
  /**
   * Budget in VND
   * @example 500000
   */
  budget?: number;
  /**
   * Post status
   * @example "OPEN"
   */
  status?: "OPEN" | "CLOSED";
}

export interface DeletePostResponseDto {
  /** @example true */
  success: boolean;
  /** @example "Post deleted successfully" */
  message: string;
  /** @example "uuid-123" */
  postId: string;
}

export interface CreateQuoteDto {
  /** ID post */
  postId: string;
  /**
   * the price of a quote
   * @example 500000
   */
  price: number;
  /** Detailed description quote */
  description: string;
  /** Terms and conditions */
  terms?: string;
  /**
   * Estimated time (minutes)
   * @example 120
   */
  estimatedDuration?: number;
  /** List of image URLs */
  imageUrls?: string[];
}

export interface UpdateQuoteDto {
  /** New offer price */
  price?: number;
  /** New description */
  description?: string;
  /** New Terms */
  terms?: string;
  /** New estimated time */
  estimatedDuration?: number;
  /** New image */
  imageUrls?: string[];
}

export interface RejectQuoteDto {
  /** Reason for refusal */
  reason?: string;
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown>
  extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "/api/v1";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) =>
    fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter(
      (key) => "undefined" !== typeof query[key],
    );
    return keys
      .map((key) =>
        Array.isArray(query[key])
          ? this.addArrayQueryParam(query, key)
          : this.addQueryParam(query, key),
      )
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.JsonApi]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.Text]: (input: any) =>
      input !== null && typeof input !== "string"
        ? JSON.stringify(input)
        : input,
    [ContentType.FormData]: (input: any) => {
      if (input instanceof FormData) {
        return input;
      }

      return Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData());
    },
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(
    params1: RequestParams,
    params2?: RequestParams,
  ): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (
    cancelToken: CancelToken,
  ): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(
      `${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`,
      {
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== ContentType.FormData
            ? { "Content-Type": type }
            : {}),
        },
        signal:
          (cancelToken
            ? this.createAbortSignal(cancelToken)
            : requestParams.signal) || null,
        body:
          typeof body === "undefined" || body === null
            ? null
            : payloadFormatter(body),
      },
    ).then(async (response) => {
      const r = response as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const responseToParse = responseFormat ? response.clone() : response;
      const data = !responseFormat
        ? r
        : await responseToParse[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
    });
  };
}

/**
 * @title Service Matching API
 * @version 1.0
 * @baseUrl /api/v1
 * @contact
 *
 * API for service-matching platform
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  auth = {
    /**
     * @description Create a new account using email, phone, and password.
     *
     * @tags Auth - Common
     * @name AuthControllerRegister
     * @summary Register a new user
     * @request POST:/auth/register
     */
    authControllerRegister: (data: RegisterDto, params: RequestParams = {}) =>
      this.request<RegisterResponseDto, ErrorResponseDto>({
        path: `/auth/register`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Revoke all refresh tokens for the current user.
     *
     * @tags Auth - Common
     * @name AuthControllerLogoutAll
     * @summary Logout from all devices
     * @request POST:/auth/logout-all
     */
    authControllerLogoutAll: (params: RequestParams = {}) =>
      this.request<void, ErrorResponseDto>({
        path: `/auth/logout-all`,
        method: "POST",
        ...params,
      }),

    /**
     * @description Authenticate user via web browser. Refresh token stored in httpOnly cookie.
     *
     * @tags Auth - Web
     * @name AuthControllerLogin
     * @summary Login (Web)
     * @request POST:/auth/login
     */
    authControllerLogin: (data: LoginDto, params: RequestParams = {}) =>
      this.request<LoginResponseDto, ErrorResponseDto>({
        path: `/auth/login`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Generate new tokens using refresh token from cookie.
     *
     * @tags Auth - Web
     * @name AuthControllerRefresh
     * @summary Refresh access token (Web)
     * @request POST:/auth/refresh
     */
    authControllerRefresh: (params: RequestParams = {}) =>
      this.request<void, ErrorResponseDto>({
        path: `/auth/refresh`,
        method: "POST",
        ...params,
      }),

    /**
     * @description Revoke refresh token and clear cookie.
     *
     * @tags Auth - Web
     * @name AuthControllerLogout
     * @summary Logout (Web)
     * @request POST:/auth/logout
     */
    authControllerLogout: (params: RequestParams = {}) =>
      this.request<void, ErrorResponseDto>({
        path: `/auth/logout`,
        method: "POST",
        ...params,
      }),

    /**
     * @description Authenticate user via mobile app. Requires X-Device-ID header.
     *
     * @tags Auth - Mobile
     * @name AuthControllerLoginMobile
     * @summary Login (Mobile)
     * @request POST:/auth/login-mobile
     */
    authControllerLoginMobile: (
      data: LoginMobileDto,
      params: RequestParams = {},
    ) =>
      this.request<LoginResponseDto, ErrorResponseDto>({
        path: `/auth/login-mobile`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Generate new tokens using refresh token from request body.
     *
     * @tags Auth - Mobile
     * @name AuthControllerRefreshMobile
     * @summary Refresh access token (Mobile)
     * @request POST:/auth/refresh-mobile
     */
    authControllerRefreshMobile: (params: RequestParams = {}) =>
      this.request<void, ErrorResponseDto>({
        path: `/auth/refresh-mobile`,
        method: "POST",
        ...params,
      }),

    /**
     * @description Revoke refresh token for specific device.
     *
     * @tags Auth - Mobile
     * @name AuthControllerLogoutMobile
     * @summary Logout (Mobile)
     * @request POST:/auth/logout-mobile
     */
    authControllerLogoutMobile: (params: RequestParams = {}) =>
      this.request<void, ErrorResponseDto>({
        path: `/auth/logout-mobile`,
        method: "POST",
        ...params,
      }),

    /**
     * @description Revoke all tokens for a specific device.
     *
     * @tags Auth - Mobile
     * @name AuthControllerLogoutDevice
     * @summary Logout specific device (Mobile)
     * @request POST:/auth/logout-device
     */
    authControllerLogoutDevice: (params: RequestParams = {}) =>
      this.request<void, ErrorResponseDto>({
        path: `/auth/logout-device`,
        method: "POST",
        ...params,
      }),
  };
  posts = {
    /**
     * @description Retrieve paginated list of all open posts from customers. Uses cursor-based pagination for infinite scroll.
     *
     * @tags Posts
     * @name PostControllerGetFeed
     * @summary Get public feed of open posts
     * @request GET:/posts/feed
     */
    postControllerGetFeed: (
      query?: {
        /**
         * Number of posts per page
         * @min 1
         * @max 50
         * @example 10
         */
        limit?: number;
        /**
         * Cursor for pagination (ISO date)
         * @example "2025-11-13T10:00:00.000Z"
         */
        cursor?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<FeedResponseDto, void>({
        path: `/posts/feed`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve detailed information of a specific post
     *
     * @tags Posts
     * @name PostControllerGetPostById
     * @summary Get post by ID
     * @request GET:/posts/{id}
     */
    postControllerGetPostById: (id: string, params: RequestParams = {}) =>
      this.request<PostResponseDto, void>({
        path: `/posts/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Update an existing post. Only the post owner can update it.
     *
     * @tags Posts
     * @name PostControllerUpdatePost
     * @summary Update post
     * @request PATCH:/posts/{id}
     * @secure
     */
    postControllerUpdatePost: (
      id: string,
      data: UpdatePostDto,
      params: RequestParams = {},
    ) =>
      this.request<PostResponseDto, void>({
        path: `/posts/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Soft delete a post. Only the post owner can delete it.
     *
     * @tags Posts
     * @name PostControllerDeletePost
     * @summary Delete post
     * @request DELETE:/posts/{id}
     * @secure
     */
    postControllerDeletePost: (id: string, params: RequestParams = {}) =>
      this.request<DeletePostResponseDto, void>({
        path: `/posts/${id}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Create a new service request post (Customer only)
     *
     * @tags Posts
     * @name PostControllerCreatePost
     * @summary Create new post
     * @request POST:/posts
     * @secure
     */
    postControllerCreatePost: (
      data: CreatePostDto,
      params: RequestParams = {},
    ) =>
      this.request<PostResponseDto, void>({
        path: `/posts`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Change post status to CLOSED. Only the post owner can close it.
     *
     * @tags Posts
     * @name PostControllerClosePost
     * @summary Close post
     * @request PATCH:/posts/{id}/close
     * @secure
     */
    postControllerClosePost: (id: string, params: RequestParams = {}) =>
      this.request<PostResponseDto, void>({
        path: `/posts/${id}/close`,
        method: "PATCH",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve all posts created by the current customer
     *
     * @tags Posts
     * @name PostControllerGetMyPosts
     * @summary Get my posts
     * @request GET:/posts/my/posts
     * @secure
     */
    postControllerGetMyPosts: (
      query?: {
        /**
         * Number of posts per page
         * @min 1
         * @max 50
         * @example 10
         */
        limit?: number;
        /**
         * Cursor for pagination (ISO date)
         * @example "2025-11-13T10:00:00.000Z"
         */
        cursor?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<FeedResponseDto, any>({
        path: `/posts/my/posts`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
  notifications = {
    /**
     * @description get list of successful notifications
     *
     * @tags Notifications
     * @name NotificationControllerGetNotifications
     * @summary get successful list
     * @request GET:/notifications
     * @secure
     */
    notificationControllerGetNotifications: (
      query?: {
        /**
         * Number of pages
         * @default 1
         */
        page?: number;
        /**
         * Quantity/page
         * @default 20
         */
        limit?: number;
        /**
         * Only take unread
         * @default false
         */
        unreadOnly?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/notifications`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Notifications
     * @name NotificationControllerGetUnreadCount
     * @summary count unread notifications
     * @request GET:/notifications/unread-count
     * @secure
     */
    notificationControllerGetUnreadCount: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/notifications/unread-count`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Notifications
     * @name NotificationControllerMarkAsRead
     * @summary mark as read
     * @request POST:/notifications/{id}/read
     * @secure
     */
    notificationControllerMarkAsRead: (
      id: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/notifications/${id}/read`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Notifications
     * @name NotificationControllerMarkAllAsRead
     * @summary mark all read
     * @request POST:/notifications/mark-all-read
     * @secure
     */
    notificationControllerMarkAllAsRead: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/notifications/mark-all-read`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Notifications
     * @name NotificationControllerDeleteNotification
     * @summary delete notification
     * @request DELETE:/notifications/{id}
     * @secure
     */
    notificationControllerDeleteNotification: (
      id: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/notifications/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Notifications
     * @name NotificationControllerDeleteReadNotifications
     * @summary delete all read receipts
     * @request DELETE:/notifications/read
     * @secure
     */
    notificationControllerDeleteReadNotifications: (
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/notifications/read`,
        method: "DELETE",
        secure: true,
        ...params,
      }),
  };
  quotes = {
    /**
     * No description
     *
     * @tags Quotes - Chào giá
     * @name QuoteControllerCreateQuote
     * @summary Create new quote (Worker)
     * @request POST:/quotes
     * @secure
     */
    quoteControllerCreateQuote: (
      data: CreateQuoteDto,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/quotes`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Quotes - Chào giá
     * @name QuoteControllerUpdateQuote
     * @summary Cập nhật chào giá (Thợ)
     * @request PUT:/quotes/{id}
     * @secure
     */
    quoteControllerUpdateQuote: (
      id: string,
      data: UpdateQuoteDto,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/quotes/${id}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Quotes - Chào giá
     * @name QuoteControllerGetQuoteById
     * @summary Xem chi tiết chào giá
     * @request GET:/quotes/{id}
     * @secure
     */
    quoteControllerGetQuoteById: (id: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/quotes/${id}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Quotes - Chào giá
     * @name QuoteControllerDeleteQuote
     * @summary Xóa chào giá (Thợ)
     * @request DELETE:/quotes/{id}
     * @secure
     */
    quoteControllerDeleteQuote: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/quotes/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Quotes - Chào giá
     * @name QuoteControllerCancelQuote
     * @summary Hủy chào giá (Thợ)
     * @request POST:/quotes/{id}/cancel
     * @secure
     */
    quoteControllerCancelQuote: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/quotes/${id}/cancel`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Quotes - Chào giá
     * @name QuoteControllerAcceptQuote
     * @summary Chấp nhận chào giá (Khách hàng)
     * @request POST:/quotes/{id}/accept
     * @secure
     */
    quoteControllerAcceptQuote: (id: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/quotes/${id}/accept`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Quotes - Chào giá
     * @name QuoteControllerRejectQuote
     * @summary Từ chối chào giá (Khách hàng)
     * @request POST:/quotes/{id}/reject
     * @secure
     */
    quoteControllerRejectQuote: (
      id: string,
      data: RejectQuoteDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/quotes/${id}/reject`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Quotes - Chào giá
     * @name QuoteControllerGetMyQuotes
     * @summary Lấy danh sách chào giá của tôi (Thợ)
     * @request GET:/quotes/my-quotes
     * @secure
     */
    quoteControllerGetMyQuotes: (
      query?: {
        /** ID post */
        postId?: string;
        /**
         * the price of a quote
         * @example 500000
         */
        price?: number;
        /** Detailed description quote */
        description?: string;
        /** Terms and conditions */
        terms?: string;
        /**
         * Estimated time (minutes)
         * @example 120
         */
        estimatedDuration?: number;
        /** List of image URLs */
        imageUrls?: string[];
        /**
         * Post status
         * @example "cancelled"
         */
        status?: "pending" | "accepted" | "rejected" | "cancelled";
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/quotes/my-quotes`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Quotes - Chào giá
     * @name QuoteControllerGetPostQuotes
     * @summary Lấy chào giá của bài đăng (Khách hàng)
     * @request GET:/quotes/post/{postId}
     * @secure
     */
    quoteControllerGetPostQuotes: (
      postId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/quotes/post/${postId}`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
}

// Re-export services
export { AuthService } from './auth.service'
export { PostService } from './post.service'
export { UserService } from './user.service'
export { ProfileService } from './profile.service'
export { notificationService } from './notification.service'
export { quoteService } from './quote.service'
export { orderService } from './order.service'

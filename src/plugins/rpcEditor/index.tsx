/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { DataStore } from "@api/index";
import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import { useForceUpdater } from "@utils/react";
import definePlugin, { OptionType } from "@utils/types";
import { React } from "@webpack/common";

import { ReplaceSettings, ReplaceTutorial } from "./ReplaceSettings";

const APP_IDS_KEY = "ReplaceActivityType_appids";
export type AppIdSetting = {
    appName: string;
    appId: string;
    enabled: boolean;
    newActivityType: ActivityType;
    newName: string,
    newDetails: string,
    newState: string,
    newLargeImageUrl: string,
    newLargeImageText: string,
    newSmallImageUrl: string,
    newSmallImageText: string;
    newStreamUrl: string;
};

export interface Activity {
    state: string;
    details: string;
    timestamps?: {
        start?: number;
        end?: number;
    };
    url?: string;
    assets: ActivityAssets;
    buttons?: Array<string>;
    name: string;
    application_id: string;
    metadata?: {
        button_urls?: Array<string>;
    };
    type: number;
    flags: number;
}

interface ActivityAssets {
    large_image: string;
    large_text: string;
    small_image: string;
    small_text: string;
}

export const enum ActivityType {
    PLAYING = 0,
    STREAMING = 1,
    LISTENING = 2,
    WATCHING = 3,
    COMPETING = 5
}

export const makeEmptyAppId: () => AppIdSetting = () => ({
    appName: "Unknown",
    appId: "",
    enabled: true,
    newActivityType: ActivityType.PLAYING,
    newName: "",
    newDetails: "",
    newState: "",
    newLargeImageUrl: "",
    newLargeImageText: "",
    newSmallImageUrl: "",
    newSmallImageText: "",
    newStreamUrl: "",
});

let appIds = [makeEmptyAppId()];

const settings = definePluginSettings({
    replacedAppIds: {
        type: OptionType.COMPONENT,
        description: "",
        component: () => {
            const update = useForceUpdater();
            return (
                <>
                    <ReplaceSettings
                        appIds={appIds}
                        update={update}
                        save={async () => DataStore.set(APP_IDS_KEY, appIds)}
                    />
                </>
            );
        }
    },
});

export default definePlugin({
    name: "RPCEditor",
    description: "Edit the type and content of any Rich Presence",
    authors: [Devs.Nyako, Devs.nin0dev],
    patches: [
        {
            find: '="LocalActivityStore",',
            replacement: {
                match: /LOCAL_ACTIVITY_UPDATE:function\((\i)\)\{/,
                replace: "$&$self.patchActivity($1.activity);",
            }
        }
    ],
    settings,
    settingsAboutComponent: () => <ReplaceTutorial />,

    async start() {
        appIds = await DataStore.get(APP_IDS_KEY) ?? [makeEmptyAppId()];
    },

    patchActivity(activity: Activity) {
        if (!activity) return;
        console.log(activity);
        appIds.forEach(app => {
            if (app.enabled && app.appId === activity.application_id) {
                activity.type = app.newActivityType;

                if (app.newActivityType === ActivityType.STREAMING && app.newStreamUrl) {
                    activity.url = app.newStreamUrl;
                }

            }
        });
    },
});

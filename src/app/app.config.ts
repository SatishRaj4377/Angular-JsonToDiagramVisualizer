import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { NuMonacoEditorModule, provideNuMonacoEditorConfig } from '@ng-util/monaco-editor';

export const appConfig: ApplicationConfig = {
  providers: [importProvidersFrom(
    NuMonacoEditorModule.forRoot({
      baseUrl: 'assets/monaco/vs',
      defaultOptions: { automaticLayout: true }
    })
  ), provideNuMonacoEditorConfig() , provideZoneChangeDetection({ eventCoalescing: true }), provideClientHydration(withEventReplay())]
};

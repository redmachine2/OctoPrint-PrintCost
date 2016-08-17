# coding=utf-8
from __future__ import absolute_import

### (Don't forget to remove me)
# This is a basic skeleton for your plugin's __init__.py. You probably want to adjust the class name of your plugin
# as well as the plugin mixins it's subclassing from. This is really just a basic skeleton to get you started.

import octoprint.plugin

class PrintCost(octoprint.plugin.StartupPlugin,
                octoprint.plugin.TemplatePlugin,
                octoprint.plugin.SettingsPlugin):
    def on_after_startup(self):
        self._logger.info("Print Cost loaded")

    def get_template_configs(selfself):
        return [
            dict(type="tab", name="Cost"),
            dict(type="settings", custom_bindings=False)
        ]

    def get_settings_default(self):
        return dict(cost=0.0666)



# If you want your plugin to be registered within OctoPrint under a different name than what you defined in setup.py
# ("OctoPrint-PluginSkeleton"), you may define that here. Same goes for the other metadata derived from setup.py that
# can be overwritten via __plugin_xyz__ control properties. See the documentation for that.
__plugin_name__ = "Print Cost"
__plugin_implementation__ = PrintCost()

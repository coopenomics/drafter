export interface TemplateFile {
  id: string;
  name: string;
  title: string;
  fileName: string;
  context: string;
  translation: Record<string, any>;
  exampleData: Record<string, any>;
}

export class TemplateService {
  private registryPath: string;
  private cooptypesPath: string;

  constructor() {
    this.registryPath =
      import.meta.env.VITE_TEMPLATES_REGISTRY_PATH || '../registry';
    this.cooptypesPath =
      import.meta.env.VITE_COOPTYPES_REGISTRY_PATH ||
      '../cooptypes/src/cooperative/registry';
  }

  async loadTemplatesList(): Promise<TemplateFile[]> {
    // В реальном приложении здесь будет запрос к API
    // Пока что заглушка для тестирования
    const templates = [
      '1.walletProgramAgreement.json',
      '100.participantApplication.json',
      '1000.investAgreement.json',
      '1001.investByResultStatement.json',
      '1002.investByResultAct.json',
      '1005.investByMoneyStatement.json',
      '101.selectBranchStatement.json',
      '1010.investMembershipConvertation.json',
      '2.regulationElectronicSignature.json',
      '3.privacyPolicy.json',
      '300.annualGeneralMeetingAgenda.json',
      '301.annualGeneralMeetingSovietDecision.json',
      '302.annualGeneralMeetingNotification.json',
      '303.annualGeneralMeetingVotingBallot.json',
      '304.annualGeneralMeetingDecision.json',
      '4.userAgreement.json',
      '50.CoopenomicsAgreement.json',
      '501.decisionOfParticipantApplication.json',
      '599.projectFreeDecision.json',
      '600.freeDecision.json',
      '700.assetContributionStatement.json',
      '701.assetContributionDecision.json',
      '702.assetContributionAct.json',
      '800.returnByAssetStatement.json',
      '801.returnByAssetDecision.json',
      '802.returnByAssetAct.json',
    ];

    return templates.map((fileName) => {
      const id = fileName.replace('.json', '');
      const name = this.formatTemplateName(fileName);

      return {
        id,
        name,
        title: name,
        fileName,
        context: '',
        translation: {},
        exampleData: {},
      };
    });
  }

  async loadTemplate(fileName: string): Promise<TemplateFile | null> {
    try {
      // В реальном приложении здесь будет запрос к серверу
      // Пока что возвращаем заглушку
      const response = await fetch(`/api/templates/${fileName}`);
      if (!response.ok) {
        throw new Error('Template not found');
      }

      const data = await response.json();

      return {
        id: fileName.replace('.json', ''),
        name: this.formatTemplateName(fileName),
        title: this.formatTemplateName(fileName),
        fileName,
        context: data.context || '',
        translation: data.translation || {},
        exampleData: data.object_model || data.model || {},
      };
    } catch (error) {
      console.error('Error loading template:', error);
      return null;
    }
  }

  async saveTemplate(template: TemplateFile): Promise<boolean> {
    try {
      // В реальном приложении здесь будет запрос к серверу для сохранения
      const data = {
        context: template.context,
        translation: template.translation,
        exampleData: template.exampleData,
      };

      const response = await fetch(`/api/templates/${template.fileName}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      return response.ok;
    } catch (error) {
      console.error('Error saving template:', error);
      return false;
    }
  }

  private formatTemplateName(fileName: string): string {
    // Форматируем имя файла для отображения
    const name = fileName.replace('.json', '');
    const parts = name.split('.');

    if (parts.length === 2) {
      const [id, namepart] = parts;
      // Преобразуем camelCase в читаемый формат
      const formatted = namepart
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();

      return `${id}. ${formatted}`;
    }

    return name;
  }
}
